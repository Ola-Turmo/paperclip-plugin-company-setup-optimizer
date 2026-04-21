import type { PluginContext, Agent, Company, Goal, Issue, Project, PluginWorkspace } from "@paperclipai/plugin-sdk";
import { AXIS_LABELS, buildAxisSummaries, buildScorecard, CHECK_DEFINITIONS } from "./catalog.js";
import { loadBrowserSnapshot, loadCompanyOptimizerState } from "./state.js";
import type {
  BrowserAgentSkillsSnapshot,
  BrowserPluginSnapshot,
  CompanyBrowserSnapshot,
  CompanyOptimizationReport,
  CompanyProfile,
  OptimizationFinding,
  SetupIssueCandidate,
  WorkerCompanySnapshot,
} from "./types.js";

const GOVERNANCE_ISSUE_TITLES = [
  "Board Doctrine and Guardrails",
  "Approval Matrix and High-Stakes Rules",
  "Repo Activation and Pack Mapping",
  "Metrics and Review Loop",
];

const ACTIVATION_ISSUE_TITLES = [
  "Independent Operating Contract",
  "First Safe Activation Sequence",
];

const COMMUNICATION_CONNECTOR_PROVIDERS = new Set([
  "gmail",
  "instagram",
  "facebook",
  "x",
  "linkedin",
  "youtube",
  "tiktok",
  "discord",
]);

const ANALYTICS_CONNECTOR_PROVIDERS = new Set([
  "google-analytics",
  "posthog",
  "meta-ads",
  "agent-analytics",
]);

const PLATFORM_CONNECTOR_PROVIDERS = new Set([
  "cloudflare",
  "render",
  "supabase",
  "clerk",
  "convex",
  "stripe",
]);

const REQUIRED_GLOBAL_PLUGIN_KEYS = [
  "paperclip-master-chat-plugin",
  "tomismeta.paperclip-aperture",
  "uos.plugin-connectors",
];

const QUALITY_PLUGIN_KEYS = [
  "uos-quality-gate",
  "uos.plugin-operations-cockpit",
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function ageHours(iso: string | null | undefined) {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  return Math.max(0, (Date.now() - then) / 3_600_000);
}

function agentNameMatches(agent: Agent, pattern: RegExp) {
  return pattern.test(agent.name) || pattern.test(agent.title ?? "");
}

function inferCompanyProfile(company: Company): CompanyProfile {
  const text = `${company.name} ${company.description ?? ""} ${company.issuePrefix ?? ""}`.toLowerCase();
  const tags = new Set<CompanyProfile["tags"][number]>();

  if (text.includes("personal")) tags.add("personal");
  if (text.includes("kurs") || text.includes("course") || text.includes("education")) tags.add("education");
  if (text.includes("lovkode") || text.includes("law") || text.includes("legal")) tags.add("legal");
  if (text.includes("gatareba") || text.includes("tax") || text.includes("compliance")) tags.add("compliance");
  if (text.includes("parallel company ai") || text.includes("factory") || text.includes("platform")) tags.add("platform");
  if (text.includes("emdash") || text.includes("saas")) tags.add("saas");
  if (text.includes("trt") || text.includes("health") || text.includes("clinic")) tags.add("health");
  if (text.includes("influencer") || text.includes("spokesperson") || text.includes("synthetic talent")) tags.add("agency");
  if (text.includes("brand") || text.includes("media") || text.includes("content")) tags.add("media");
  if (text.includes("authority") || text.includes("public") || text.includes("customer") || text.includes("growth")) tags.add("public");
  if (tags.has("legal") || tags.has("compliance") || tags.has("health")) tags.add("regulated");
  if (tags.has("education") || tags.has("agency") || tags.has("media") || tags.has("saas")) tags.add("growth");
  if (tags.has("platform")) tags.add("internal");

  return {
    companyId: company.id,
    companyName: company.name,
    prefix: company.issuePrefix ?? null,
    tags: [...tags],
    expectsStandardOrg: !tags.has("agency"),
    expectsAgencyOrg: tags.has("agency"),
    needsSocialStack: tags.has("public") || tags.has("agency") || tags.has("media"),
    needsAnalytics: tags.has("growth") || tags.has("saas") || tags.has("platform"),
    needsProductInfra: tags.has("saas") || tags.has("platform") || tags.has("compliance") || tags.has("legal"),
    needsQualityGate: tags.has("regulated") || tags.has("saas") || tags.has("platform"),
    needsLearning: !tags.has("internal") || tags.has("platform"),
  };
}

async function listAll<T>(fetchPage: (offset: number, limit: number) => Promise<T[]>) {
  const limit = 100;
  const items: T[] = [];
  for (let offset = 0; ; offset += limit) {
    const page = await fetchPage(offset, limit);
    items.push(...page);
    if (page.length < limit) break;
  }
  return items;
}

async function buildWorkerCompanySnapshot(ctx: PluginContext, company: Company): Promise<WorkerCompanySnapshot> {
  const [agents, goals, issues, projects, browserSnapshot] = await Promise.all([
    listAll((offset, limit) => ctx.agents.list({ companyId: company.id, offset, limit })),
    listAll((offset, limit) => ctx.goals.list({ companyId: company.id, offset, limit })),
    listAll((offset, limit) => ctx.issues.list({ companyId: company.id, offset, limit })),
    listAll((offset, limit) => ctx.projects.list({ companyId: company.id, offset, limit })),
    loadBrowserSnapshot(ctx, company.id),
  ]);

  const projectsWithWorkspaces = await Promise.all(
    projects.map(async (project) => ({
      ...project,
      pluginWorkspaces: await ctx.projects.listWorkspaces(project.id, company.id),
    })),
  );

  return {
    company,
    agents,
    goals,
    issues,
    projects: projectsWithWorkspaces,
    browserSnapshot,
    generatedAt: new Date().toISOString(),
  };
}

function pluginByKey(snapshot: CompanyBrowserSnapshot | null, pluginKey: string): BrowserPluginSnapshot | null {
  return snapshot?.plugins.find((plugin) => plugin.pluginKey === pluginKey) ?? null;
}

function projectRepoCount(snapshot: WorkerCompanySnapshot) {
  return snapshot.projects.reduce(
    (sum, project) => sum + project.pluginWorkspaces.filter((workspace) => Boolean((workspace as { repoUrl?: string | null }).repoUrl)).length,
    0,
  );
}

function findAgentSkills(snapshot: CompanyBrowserSnapshot | null, agentId: string): BrowserAgentSkillsSnapshot | null {
  return snapshot?.agentSkills.find((skills) => skills.agentId === agentId) ?? null;
}

function hasGithubBackedSkills(snapshot: CompanyBrowserSnapshot | null) {
  return Boolean(snapshot?.companySkills.some((skill) => skill.sourceType === "github"));
}

function connectorProviderSet(snapshot: CompanyBrowserSnapshot | null) {
  return new Set(snapshot?.connectors.connections.map((connection) => connection.providerId) ?? []);
}

function issueTitleExists(snapshot: WorkerCompanySnapshot, title: string) {
  return snapshot.issues.some((issue) => issue.title === title);
}

function countGoalsByLevel(snapshot: WorkerCompanySnapshot, level: Goal["level"]) {
  return snapshot.goals.filter((goal) => goal.level === level).length;
}

function countOpenIssues(snapshot: WorkerCompanySnapshot) {
  return snapshot.issues.filter((issue) => !["done", "cancelled"].includes(issue.status)).length;
}

function expectedRolePatterns(profile: CompanyProfile) {
  if (profile.expectsAgencyOrg) {
    return [
      /agency ceo/i,
      /talent studio/i,
      /client success/i,
      /growth distribution/i,
      /service operations/i,
      /disclosure/i,
      /media systems/i,
      /performance intelligence/i,
    ];
  }

  return [
    /^ceo$/i,
    /operations/i,
    /growth/i,
    /product/i,
    /finance/i,
    /customer/i,
    /people/i,
    /social/i,
  ];
}

function companyIsDormantSkeleton(snapshot: WorkerCompanySnapshot) {
  return (
    snapshot.agents.length > 0 &&
    snapshot.agents.every(
      (agent) => agent.status === "paused" && ((agent.metadata as Record<string, unknown> | null)?.dormantOrgSkeleton === true),
    )
  );
}

function findExistingOptimizerIssue(snapshot: WorkerCompanySnapshot, key: string) {
  return (
    snapshot.issues.find((issue) =>
      normalize(issue.title).startsWith("[setup optimizer]") &&
      normalize(issue.description).includes(`optimizer key: ${key}`),
    ) ?? null
  );
}

function addFinding(
  list: OptimizationFinding[],
  id: string,
  status: OptimizationFinding["status"],
  evidence: string,
  source: OptimizationFinding["source"],
  suppressed: boolean,
) {
  const definition = CHECK_DEFINITIONS[id];
  if (!definition) {
    throw new Error(`Unknown optimization check id: ${id}`);
  }
  list.push({
    ...definition,
    status,
    evidence,
    source,
    suppressed,
  });
}

function evaluateCompany(snapshot: WorkerCompanySnapshot, companyState: Awaited<ReturnType<typeof loadCompanyOptimizerState>>): CompanyOptimizationReport {
  const profile = inferCompanyProfile(snapshot.company);
  const findings: OptimizationFinding[] = [];
  const suppressions = new Set(companyState.suppressedFindingIds);
  const browserSnapshot = snapshot.browserSnapshot;
  const snapshotAgeHours = ageHours(browserSnapshot?.capturedAt);

  const agents = snapshot.agents;
  const projects = snapshot.projects;
  const issues = snapshot.issues;
  const goals = snapshot.goals;
  const openIssueCount = countOpenIssues(snapshot);
  const ceos = agents.filter((agent) => agent.role === "ceo" || /^ceo$/i.test(agent.name) || /ceo/i.test(agent.title ?? ""));
  const dormantSkeleton = companyIsDormantSkeleton(snapshot);
  const orphanAgents = agents.filter((agent) => !ceos.some((ceo) => ceo.id === agent.id) && !agent.reportsTo);
  const duplicateNames = unique(
    agents
      .map((agent) => normalize(agent.name))
      .filter((name, index, all) => Boolean(name) && all.indexOf(name) !== index),
  );
  const roleCoverage = expectedRolePatterns(profile).filter((pattern) => agents.some((agent) => agentNameMatches(agent, pattern))).length;
  const expectedRoleCount = expectedRolePatterns(profile).length;

  addFinding(
    findings,
    "identity.description_present",
    snapshot.company.description && snapshot.company.description.trim().length > 40 ? "pass" : "failing",
    snapshot.company.description
      ? `Description length ${snapshot.company.description.trim().length}.`
      : "Company description is missing.",
    "sdk",
    suppressions.has("identity.description_present"),
  );
  addFinding(
    findings,
    "identity.branding_present",
    snapshot.company.logoUrl && snapshot.company.brandColor ? "pass" : "warning",
    `logo=${Boolean(snapshot.company.logoUrl)} brandColor=${Boolean(snapshot.company.brandColor)}`,
    "sdk",
    suppressions.has("identity.branding_present"),
  );
  addFinding(
    findings,
    "identity.issue_prefix_present",
    snapshot.company.issuePrefix ? "pass" : "warning",
    snapshot.company.issuePrefix ? `Issue prefix ${snapshot.company.issuePrefix} is configured.` : "Issue prefix is missing.",
    "sdk",
    suppressions.has("identity.issue_prefix_present"),
  );
  addFinding(
    findings,
    "identity.scope_clear",
    snapshot.company.description && snapshot.company.description.trim().length > 80 ? "pass" : "warning",
    "Using company description richness as a proxy for explicit scope boundaries.",
    "inference",
    suppressions.has("identity.scope_clear"),
  );

  addFinding(
    findings,
    "org.single_ceo",
    ceos.length === 1 ? "pass" : ceos.length === 0 ? "critical" : "failing",
    `Found ${ceos.length} CEO-like agents.`,
    "sdk",
    suppressions.has("org.single_ceo"),
  );
  addFinding(
    findings,
    "org.expected_role_coverage",
    roleCoverage >= expectedRoleCount ? "pass" : roleCoverage >= Math.max(4, expectedRoleCount - 2) ? "warning" : "failing",
    `Matched ${roleCoverage}/${expectedRoleCount} expected role patterns for ${profile.expectsAgencyOrg ? "agency" : "standard"} org.`,
    "inference",
    suppressions.has("org.expected_role_coverage"),
  );
  addFinding(
    findings,
    "org.no_orphans",
    orphanAgents.length === 0 ? "pass" : "critical",
    orphanAgents.length === 0 ? "All non-CEO agents report to a manager." : `Orphan agents: ${orphanAgents.map((agent) => agent.name).join(", ")}`,
    "sdk",
    suppressions.has("org.no_orphans"),
  );
  addFinding(
    findings,
    "org.shallow_hierarchy",
    agents.every((agent) => !agent.reportsTo || ceos.some((ceo) => ceo.id === agent.reportsTo)) ? "pass" : "warning",
    "This check treats manager->CEO as the intended shallow default.",
    "sdk",
    suppressions.has("org.shallow_hierarchy"),
  );
  addFinding(
    findings,
    "org.unique_agent_names",
    duplicateNames.length === 0 ? "pass" : "warning",
    duplicateNames.length === 0 ? "Agent names are unique." : `Duplicate normalized names: ${duplicateNames.join(", ")}`,
    "sdk",
    suppressions.has("org.unique_agent_names"),
  );

  const placeholderAgents = agents.filter((agent) => normalize(agent.adapterType) === "process");
  const missingCwdAgents = agents.filter((agent) => !((agent.adapterConfig as { cwd?: string | null } | null)?.cwd));
  const missingModelAgents = agents.filter((agent) => {
    const config = (agent.adapterConfig as Record<string, unknown> | null) ?? {};
    return !("model" in config) && agent.adapterType !== "hermes_local";
  });
  const zeroBudgetAgents = agents.filter((agent) => (agent.budgetMonthlyCents ?? 0) === 0);
  const unsupportedSkillAgents = (browserSnapshot?.agentSkills ?? []).filter((skills) => !skills.supported);
  const nonIsolatedHomeAgents = agents.filter((agent) => {
    const env = ((agent.adapterConfig as { env?: Record<string, { value?: string }> } | null)?.env ?? {}) as Record<string, { value?: string }>;
    if (agent.adapterType === "codex_local" || agent.adapterType === "hermes_local") return false;
    return !env.HOME?.value?.includes("/agent-homes/");
  });

  addFinding(findings, "runtime.non_placeholder_adapters", placeholderAgents.length === 0 ? "pass" : "critical", placeholderAgents.length === 0 ? "All agents use non-placeholder adapters." : `Placeholder adapters: ${placeholderAgents.map((agent) => `${agent.name}:${agent.adapterType}`).join(", ")}`, "sdk", suppressions.has("runtime.non_placeholder_adapters"));
  addFinding(findings, "runtime.cwd_present", missingCwdAgents.length === 0 ? "pass" : "failing", missingCwdAgents.length === 0 ? "All agents have cwd configured." : `Missing cwd: ${missingCwdAgents.map((agent) => agent.name).join(", ")}`, "sdk", suppressions.has("runtime.cwd_present"));
  addFinding(findings, "runtime.model_present", missingModelAgents.length === 0 ? "pass" : "warning", missingModelAgents.length === 0 ? "Explicit model configuration present where expected." : `Missing explicit model: ${missingModelAgents.map((agent) => agent.name).join(", ")}`, "sdk", suppressions.has("runtime.model_present"));
  addFinding(findings, "runtime.budget_explicit", zeroBudgetAgents.length === 0 || dormantSkeleton ? "pass" : "warning", zeroBudgetAgents.length === 0 ? "All agents have non-zero explicit budget ceilings." : dormantSkeleton ? "Company is intentionally operating as a paused zero-budget org skeleton." : `${zeroBudgetAgents.length} agents currently use zero-budget posture.`, "sdk", suppressions.has("runtime.budget_explicit"));
  addFinding(findings, "runtime.skill_runtime_supported", browserSnapshot ? (unsupportedSkillAgents.length === 0 ? "pass" : "failing") : "warning", browserSnapshot ? (unsupportedSkillAgents.length === 0 ? "All sampled agent skill runtimes are supported." : `Unsupported skill runtime for ${unsupportedSkillAgents.map((agent) => agent.agentId).join(", ")}`) : "No browser-side agent skill snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("runtime.skill_runtime_supported"));
  addFinding(findings, "runtime.home_isolated", nonIsolatedHomeAgents.length === 0 ? "pass" : "warning", nonIsolatedHomeAgents.length === 0 ? "Agent homes appear isolated where expected." : `Potentially non-isolated HOME env for ${nonIsolatedHomeAgents.map((agent) => agent.name).join(", ")}`, "sdk", suppressions.has("runtime.home_isolated"));

  addFinding(findings, "skills.company_skills_present", browserSnapshot ? (browserSnapshot.companySkills.length >= 8 ? "pass" : "failing") : "warning", browserSnapshot ? `${browserSnapshot.companySkills.length} company skills available.` : "No browser-side company skills snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("skills.company_skills_present"));
  addFinding(findings, "skills.github_backed_present", browserSnapshot ? (hasGithubBackedSkills(browserSnapshot) ? "pass" : "failing") : "warning", browserSnapshot ? (hasGithubBackedSkills(browserSnapshot) ? "GitHub-backed skills are present." : "No GitHub-backed company skills found.") : "No company skills snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("skills.github_backed_present"));
  addFinding(findings, "skills.repo_skills_attached", browserSnapshot ? (browserSnapshot.companySkills.some((skill) => skill.attachedAgentCount > 0 && skill.sourceType === "github") ? "pass" : "warning") : "warning", browserSnapshot ? "Checking whether at least one GitHub-backed company skill is attached to an agent." : "No company skills snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("skills.repo_skills_attached"));
  addFinding(findings, "skills.no_agent_skill_warnings", browserSnapshot ? ((browserSnapshot.agentSkills.some((agent) => agent.warnings.length > 0)) ? "failing" : "pass") : "warning", browserSnapshot ? "Agent skill snapshots checked for warning output." : "No agent skill snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("skills.no_agent_skill_warnings"));
  addFinding(findings, "skills.project_workspaces_present", projects.length > 0 && projects.every((project) => project.pluginWorkspaces.length > 0) ? "pass" : "failing", `${projects.length} projects, ${projects.filter((project) => project.pluginWorkspaces.length > 0).length} with at least one workspace.`, "sdk", suppressions.has("skills.project_workspaces_present"));
  addFinding(findings, "skills.primary_workspace_present", projects.every((project) => project.pluginWorkspaces.some((workspace) => workspace.isPrimary)) ? "pass" : "warning", "Checked whether each project has a primary workspace.", "sdk", suppressions.has("skills.primary_workspace_present"));

  addFinding(findings, "planning.goal_tree_present", countGoalsByLevel(snapshot, "company") >= 1 && countGoalsByLevel(snapshot, "team") >= 1 && countGoalsByLevel(snapshot, "agent") >= 1 ? "pass" : "failing", `company=${countGoalsByLevel(snapshot, "company")} team=${countGoalsByLevel(snapshot, "team")} agent=${countGoalsByLevel(snapshot, "agent")}`, "sdk", suppressions.has("planning.goal_tree_present"));
  addFinding(findings, "planning.projects_present", projects.length > 0 ? "pass" : "failing", `${projects.length} projects detected.`, "sdk", suppressions.has("planning.projects_present"));
  addFinding(findings, "planning.governance_issues_present", GOVERNANCE_ISSUE_TITLES.every((title) => issueTitleExists(snapshot, title)) ? "pass" : "failing", `Present governance issues: ${GOVERNANCE_ISSUE_TITLES.filter((title) => issueTitleExists(snapshot, title)).length}/${GOVERNANCE_ISSUE_TITLES.length}`, "sdk", suppressions.has("planning.governance_issues_present"));
  addFinding(findings, "planning.activation_issues_present", ACTIVATION_ISSUE_TITLES.every((title) => issueTitleExists(snapshot, title)) ? "pass" : "failing", `Present activation issues: ${ACTIVATION_ISSUE_TITLES.filter((title) => issueTitleExists(snapshot, title)).length}/${ACTIVATION_ISSUE_TITLES.length}`, "sdk", suppressions.has("planning.activation_issues_present"));
  addFinding(findings, "planning.issue_noise_controlled", openIssueCount <= 20 ? "pass" : openIssueCount <= 40 ? "warning" : "failing", `${openIssueCount} open issues currently exist.`, "sdk", suppressions.has("planning.issue_noise_controlled"));

  addFinding(findings, "governance.board_approval_enabled", snapshot.company.requireBoardApprovalForNewAgents ? "pass" : "critical", `requireBoardApprovalForNewAgents=${snapshot.company.requireBoardApprovalForNewAgents}`, "sdk", suppressions.has("governance.board_approval_enabled"));
  addFinding(findings, "governance.approval_matrix_exists", issueTitleExists(snapshot, "Approval Matrix and High-Stakes Rules") ? "pass" : "critical", issueTitleExists(snapshot, "Approval Matrix and High-Stakes Rules") ? "Approval matrix issue exists." : "Approval matrix issue missing.", "sdk", suppressions.has("governance.approval_matrix_exists"));
  addFinding(findings, "governance.regulated_review_strength", profile.needsQualityGate ? (pluginByKey(browserSnapshot, "uos-quality-gate")?.status === "ready" ? "pass" : "failing") : "pass", profile.needsQualityGate ? `Quality Gate plugin status: ${pluginByKey(browserSnapshot, "uos-quality-gate")?.status ?? "unknown"}` : "Company does not currently infer as requiring stronger regulated review.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("governance.regulated_review_strength"));

  const connectorProviders = connectorProviderSet(browserSnapshot);
  addFinding(findings, "connectors.snapshot_present", browserSnapshot ? "pass" : "warning", browserSnapshot ? `Browser snapshot captured ${browserSnapshot.capturedAt}.` : "No browser snapshot captured yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("connectors.snapshot_present"));
  addFinding(findings, "connectors.github_present", connectorProviders.has("github") ? "pass" : "failing", connectorProviders.has("github") ? "GitHub connector is present." : "GitHub connector is missing.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("connectors.github_present"));
  addFinding(findings, "connectors.records_clear", browserSnapshot ? ((browserSnapshot.connectors.summary?.warnings.length ?? 0) === 0 ? "pass" : "failing") : "warning", browserSnapshot ? `Connector warnings: ${browserSnapshot.connectors.summary?.warnings.join("; ") || "none"}` : "No connector snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("connectors.records_clear"));
  addFinding(findings, "connectors.secret_metadata_present", browserSnapshot ? (browserSnapshot.secrets.length > 0 ? "pass" : "failing") : "warning", browserSnapshot ? `${browserSnapshot.secrets.length} secret metadata entries detected.` : "No secret snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("connectors.secret_metadata_present"));

  const expectedProviders: string[] = ["github"];
  if (profile.needsSocialStack) expectedProviders.push("gmail");
  if (profile.needsAnalytics) expectedProviders.push("posthog");
  if (profile.needsProductInfra) expectedProviders.push("cloudflare");
  if (profile.tags.includes("agency") || profile.tags.includes("platform")) expectedProviders.push("discord");
  const missingExpectedProviders = unique(expectedProviders.filter((provider) => !connectorProviders.has(provider)));
  addFinding(findings, "connectors.provider_fit", missingExpectedProviders.length === 0 ? "pass" : dormantSkeleton ? "warning" : missingExpectedProviders.length <= 2 ? "warning" : "failing", missingExpectedProviders.length === 0 ? "Connector provider coverage matches the inferred company profile." : dormantSkeleton ? `Missing likely providers for future activation: ${missingExpectedProviders.join(", ")}` : `Missing likely providers: ${missingExpectedProviders.join(", ")}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("connectors.provider_fit"));

  const communicationCoverage = [...connectorProviders].filter((provider) => COMMUNICATION_CONNECTOR_PROVIDERS.has(provider)).length;
  addFinding(findings, "growth.channel_fit", profile.needsSocialStack ? (communicationCoverage > 0 ? "pass" : "warning") : "pass", `Detected ${communicationCoverage} communication connectors.`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("growth.channel_fit"));
  const analyticsCoverage = [...connectorProviders].filter((provider) => ANALYTICS_CONNECTOR_PROVIDERS.has(provider)).length;
  addFinding(findings, "growth.analytics_fit", profile.needsAnalytics ? (analyticsCoverage > 0 ? "pass" : "warning") : "pass", `Detected ${analyticsCoverage} analytics-oriented connectors.`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("growth.analytics_fit"));

  const primaryCodebaseProjects = projects.filter((project) => project.pluginWorkspaces.some((workspace) => workspace.isPrimary));
  addFinding(findings, "delivery.codebase_present", profile.needsProductInfra ? (primaryCodebaseProjects.length > 0 ? "pass" : "failing") : "pass", `${primaryCodebaseProjects.length} projects have a primary workspace.`, "sdk", suppressions.has("delivery.codebase_present"));
  const opsCockpitReady = pluginByKey(browserSnapshot, "uos.plugin-operations-cockpit")?.status === "ready";
  const qualityReady = pluginByKey(browserSnapshot, "uos-quality-gate")?.status === "ready";
  addFinding(findings, "delivery.quality_ops_ready", profile.needsProductInfra ? (opsCockpitReady && qualityReady ? "pass" : "warning") : "pass", `operationsCockpit=${opsCockpitReady} qualityGate=${qualityReady}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("delivery.quality_ops_ready"));
  const platformCoverage = [...connectorProviders].filter((provider) => PLATFORM_CONNECTOR_PROVIDERS.has(provider)).length;
  addFinding(findings, "delivery.platform_accounts_fit", profile.needsProductInfra ? (platformCoverage > 0 ? "pass" : "warning") : "pass", `Detected ${platformCoverage} platform/account connectors.`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("delivery.platform_accounts_fit"));

  addFinding(findings, "safety.regulated_controls_fit", profile.tags.includes("regulated") ? (qualityReady ? "pass" : "failing") : "pass", profile.tags.includes("regulated") ? `Regulated company quality gate status=${qualityReady}` : "Company is not inferred as regulated.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("safety.regulated_controls_fit"));
  addFinding(findings, "safety.secret_isolation_fit", browserSnapshot ? (browserSnapshot.secrets.length > 0 ? "pass" : "failing") : "warning", browserSnapshot ? "Using company-scoped secret metadata presence as safety proxy." : "No secret snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("safety.secret_isolation_fit"));
  const brokenRequiredPlugins = REQUIRED_GLOBAL_PLUGIN_KEYS
    .map((pluginKey) => pluginByKey(browserSnapshot, pluginKey))
    .filter((plugin) => !plugin || plugin.status !== "ready");
  addFinding(findings, "safety.required_plugins_not_broken", brokenRequiredPlugins.length === 0 ? "pass" : "failing", brokenRequiredPlugins.length === 0 ? "Required global plugins are ready." : `Missing or not-ready required plugins: ${brokenRequiredPlugins.map((plugin) => plugin?.pluginKey ?? "unknown").join(", ")}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("safety.required_plugins_not_broken"));

  addFinding(findings, "plugins.master_chat_ready", pluginByKey(browserSnapshot, "paperclip-master-chat-plugin")?.status === "ready" ? "pass" : "warning", `Master Chat status=${pluginByKey(browserSnapshot, "paperclip-master-chat-plugin")?.status ?? "unknown"}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("plugins.master_chat_ready"));
  addFinding(findings, "plugins.aperture_ready", pluginByKey(browserSnapshot, "tomismeta.paperclip-aperture")?.status === "ready" ? "pass" : "warning", `Aperture status=${pluginByKey(browserSnapshot, "tomismeta.paperclip-aperture")?.status ?? "unknown"}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("plugins.aperture_ready"));
  addFinding(findings, "plugins.connectors_ready", pluginByKey(browserSnapshot, "uos.plugin-connectors")?.status === "ready" ? "pass" : "failing", `Connectors plugin status=${pluginByKey(browserSnapshot, "uos.plugin-connectors")?.status ?? "unknown"}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("plugins.connectors_ready"));
  const companySpecificRecommended = profile.needsSocialStack ? "uos.department-social-media" : profile.needsQualityGate ? "uos-quality-gate" : null;
  addFinding(findings, "plugins.company_specific_fit", companySpecificRecommended ? (pluginByKey(browserSnapshot, companySpecificRecommended)?.status === "ready" ? "pass" : "warning") : "pass", companySpecificRecommended ? `Recommended plugin ${companySpecificRecommended} status=${pluginByKey(browserSnapshot, companySpecificRecommended)?.status ?? "unknown"}` : "No extra company-specific plugin requirement inferred.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("plugins.company_specific_fit"));

  const learningReady = pluginByKey(browserSnapshot, "uos.org-learning")?.status === "ready" || pluginByKey(browserSnapshot, "uos.org-learning")?.status === "disabled";
  addFinding(findings, "learning.learning_surface_fit", profile.needsLearning ? (learningReady ? "pass" : "warning") : "pass", `Org-learning plugin status=${pluginByKey(browserSnapshot, "uos.org-learning")?.status ?? "unknown"}`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("learning.learning_surface_fit"));
  addFinding(findings, "learning.skill_reuse_fit", browserSnapshot ? (browserSnapshot.companySkills.some((skill) => skill.attachedAgentCount > 0) ? "pass" : "warning") : "warning", browserSnapshot ? "Checking for attached reusable skills." : "No company skills snapshot yet.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("learning.skill_reuse_fit"));

  addFinding(findings, "activation.independence_contract_present", issueTitleExists(snapshot, "Independent Operating Contract") ? "pass" : "failing", issueTitleExists(snapshot, "Independent Operating Contract") ? "Independence contract issue exists." : "Independent Operating Contract issue missing.", "sdk", suppressions.has("activation.independence_contract_present"));
  addFinding(findings, "activation.first_safe_sequence_present", issueTitleExists(snapshot, "First Safe Activation Sequence") ? "pass" : "failing", issueTitleExists(snapshot, "First Safe Activation Sequence") ? "First Safe Activation Sequence issue exists." : "First Safe Activation Sequence issue missing.", "sdk", suppressions.has("activation.first_safe_sequence_present"));
  const blockingFindingsCount = findings.filter((finding) => !finding.suppressed && finding.blocksActivation && finding.status !== "pass").length;
  addFinding(findings, "activation.company_can_move_forward", blockingFindingsCount === 0 ? "pass" : blockingFindingsCount <= 4 ? "warning" : "critical", `${blockingFindingsCount} currently evaluated blockers for independent movement.`, "hybrid", suppressions.has("activation.company_can_move_forward"));

  addFinding(findings, "ux.operator_navigation_fit", snapshot.company.logoUrl && snapshot.company.brandColor && snapshot.company.issuePrefix ? "pass" : "warning", "Using company branding and prefix presence as navigation clarity proxy.", "sdk", suppressions.has("ux.operator_navigation_fit"));
  addFinding(findings, "ux.operator_surfaces_prominent", pluginByKey(browserSnapshot, "paperclip-master-chat-plugin")?.status === "ready" ? "pass" : "warning", "Master Chat readiness is used as the operator-surface prominence proxy.", browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("ux.operator_surfaces_prominent"));
  addFinding(findings, "ux.snapshot_freshness", snapshotAgeHours == null ? "warning" : snapshotAgeHours <= 24 ? "pass" : snapshotAgeHours <= 72 ? "warning" : "failing", snapshotAgeHours == null ? "No browser-side snapshot has been captured." : `Browser snapshot age ${snapshotAgeHours.toFixed(1)}h.`, browserSnapshot ? "browser_snapshot" : "inference", suppressions.has("ux.snapshot_freshness"));

  addFinding(findings, "efficiency.budget_posture_fit", zeroBudgetAgents.length === 0 || dormantSkeleton ? "pass" : zeroBudgetAgents.length <= 2 ? "warning" : "failing", dormantSkeleton ? "Zero-budget posture is currently intentional for a paused org skeleton." : `${zeroBudgetAgents.length} of ${agents.length} agents currently have zero budget ceilings.`, "sdk", suppressions.has("efficiency.budget_posture_fit"));
  addFinding(findings, "efficiency.not_overbuilt", agents.length <= 12 ? "pass" : "warning", `${agents.length} agents currently defined.`, "sdk", suppressions.has("efficiency.not_overbuilt"));
  addFinding(findings, "efficiency.not_underbuilt", projects.length > 0 && goals.length > 0 && agents.length >= 4 ? "pass" : "failing", `${projects.length} projects, ${goals.length} goals, ${agents.length} agents.`, "sdk", suppressions.has("efficiency.not_underbuilt"));

  const axisSummaries = buildAxisSummaries({ findings });
  const scorecard = buildScorecard(axisSummaries);
  const issueCandidates: SetupIssueCandidate[] = findings
    .filter((finding) => !finding.suppressed && finding.status !== "pass" && finding.issueWhenHumanActionNeeded)
    .map((finding) => {
      const existing = findExistingOptimizerIssue(snapshot, finding.id);
      return {
        key: finding.id,
        title: `[Setup Optimizer] ${finding.title}`,
        axis: finding.axis,
        severity: finding.severity,
        whyItMatters: `${finding.description}\n\nEvidence: ${finding.evidence}`,
        suggestedResolution: finding.suggestedFix,
        blocksActivation: finding.blocksActivation,
        existingIssueId: existing?.id ?? companyState.materializedIssues[finding.id] ?? null,
      };
    });

  return {
    companyId: snapshot.company.id,
    mode: "live",
    checkedAt: new Date().toISOString(),
    profile,
    snapshotFreshnessHours: snapshotAgeHours,
    scorecard,
    axisSummaries,
    findings,
    issueCandidates,
    stats: {
      agentCount: agents.length,
      projectCount: projects.length,
      goalCount: goals.length,
      issueCount: issues.length,
      openIssueCount,
      companySkillCount: browserSnapshot?.companySkills.length ?? null,
      connectorCount: browserSnapshot?.connectors.connections.length ?? null,
      secretCount: browserSnapshot?.secrets.length ?? null,
    },
  };
}

export async function analyzeCompany(ctx: PluginContext, companyId: string): Promise<CompanyOptimizationReport> {
  const company = await ctx.companies.get(companyId);
  if (!company) {
    throw new Error(`Company '${companyId}' not found`);
  }
  const [snapshot, companyState] = await Promise.all([
    buildWorkerCompanySnapshot(ctx, company),
    loadCompanyOptimizerState(ctx, companyId),
  ]);
  return evaluateCompany(snapshot, companyState);
}

export async function analyzePortfolio(ctx: PluginContext) {
  const companies = await listAll((offset, limit) => ctx.companies.list({ offset, limit }));
  const reports = await Promise.all(companies.map((company) => analyzeCompany(ctx, company.id)));
  return {
    checkedAt: new Date().toISOString(),
    companies: reports.map((report) => ({
      companyId: report.companyId ?? "",
      companyName: report.profile?.companyName ?? "",
      overallScore: report.scorecard.overall,
      criticalCount: report.findings.filter((finding) => !finding.suppressed && finding.status === "critical").length,
      failingCount: report.findings.filter((finding) => !finding.suppressed && finding.status === "failing").length,
      issueCandidateCount: report.issueCandidates.length,
      readiness: report.scorecard.readiness,
      safety: report.scorecard.safety,
    })),
  };
}

export function buildIssueDescription(report: CompanyOptimizationReport, candidate: SetupIssueCandidate) {
  return [
    "Created by paperclip-plugin-company-setup-optimizer.",
    "",
    `Optimizer key: ${candidate.key}`,
    `Axis: ${AXIS_LABELS[candidate.axis]}`,
    `Severity: ${candidate.severity}`,
    `Blocks activation: ${candidate.blocksActivation ? "yes" : "no"}`,
    "",
    "Why this matters",
    candidate.whyItMatters,
    "",
    "Suggested resolution",
    candidate.suggestedResolution,
    "",
    `Optimizer checked at: ${report.checkedAt}`,
  ].join("\n");
}
