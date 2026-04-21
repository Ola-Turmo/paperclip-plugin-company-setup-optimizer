import type {
  OptimizationAxis,
  OptimizationCheckDefinition,
  SetupIssueCandidate,
  CompanyOptimizationReport,
  OptimizationAxisSummary,
  OptimizationScorecard,
  OptimizationFinding,
  CheckStatus,
} from "./types.js";

type Seed = Omit<OptimizationCheckDefinition, "id" | "axis">;

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function checksForAxis(axis: OptimizationAxis, seeds: Seed[]): OptimizationCheckDefinition[] {
  return seeds.map((seed) => ({
    ...seed,
    axis,
    id: `${axis}.${slug(seed.title)}`,
  }));
}

export const AXIS_LABELS: Record<OptimizationAxis, string> = {
  identity: "Identity & Mission",
  org_structure: "Org Structure",
  agent_runtime: "Agent Runtime",
  skills_and_repos: "Skills & Repos",
  goals_projects_issues: "Goals, Projects & Issues",
  governance: "Governance & Approvals",
  connectors_accounts: "Connectors & Accounts",
  growth_surfaces: "Growth Surfaces",
  product_delivery: "Product & Delivery",
  safety_compliance: "Safety & Compliance",
  plugin_fit: "Plugin Fit",
  data_learning: "Data & Learning",
  activation_readiness: "Activation Readiness",
  operator_ux: "Operator UX",
  efficiency_cost: "Efficiency & Cost",
};

export const CHECK_CATALOG: OptimizationCheckDefinition[] = [
  ...checksForAxis("identity", [
    {
      title: "Company mission is explicit",
      description: "The company should have a precise mission, not a vague placeholder summary.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Write a sharp company mission, scope boundary, and definition of success.",
    },
    {
      title: "Company type is explicit",
      description: "The setup should clearly indicate whether the company is product, service, internal platform, personal, or regulated workspace.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Add explicit company-type framing to company doctrine and projects.",
    },
    {
      title: "Branding is representative",
      description: "The company should have usable logo, name, description, and color so the operator can navigate the portfolio quickly.",
      severity: "low",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Set representative branding assets and descriptive text.",
    },
    {
      title: "Scope boundaries are documented",
      description: "Cross-company overlap should be intentional rather than implied.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Document what this company owns and what neighboring companies own.",
    },
    {
      title: "Success metrics are company-specific",
      description: "The company should know what winning looks like in its own domain.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Define specific outcomes and operating metrics for this company.",
    },
  ]),
  ...checksForAxis("org_structure", [
    {
      title: "CEO exists and is unique",
      description: "Every company should have exactly one CEO-rooted control point.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Create or normalize a single CEO agent as the root of the org tree.",
    },
    {
      title: "Required manager roles exist",
      description: "Core manager coverage should match the company type and mission.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Add the missing manager roles or justify why they are intentionally absent.",
    },
    {
      title: "No orphan agents",
      description: "Every non-CEO agent should report to exactly one manager.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Repair reporting lines so every agent belongs to the intended chain.",
    },
    {
      title: "No duplicate management roles without intent",
      description: "Duplicate managers should be deliberate, not accidental drift.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Remove duplicate managers or document why they both exist.",
    },
    {
      title: "Paused and active state matches policy",
      description: "Org topology should reflect whether the company is live, staging, or intentionally paused.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Normalize the active or paused state of the company org.",
    },
  ]),
  ...checksForAxis("agent_runtime", [
    {
      title: "Every agent has a real adapter",
      description: "Placeholder shells are not acceptable once a company is intended to operate seriously.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Assign real adapters that match the role and runtime policy.",
    },
    {
      title: "Adapter fits role",
      description: "Research, coding, and operator roles should not all share the same runtime blindly.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Map each role to the runtime that best fits its work type.",
    },
    {
      title: "Agent budgets are explicit",
      description: "Every agent should have cost guardrails before autonomy grows.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Set per-agent budget policy and review thresholds.",
    },
    {
      title: "Role-specific skills are attached",
      description: "A live runtime without the right skills is not truly operational.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Attach the expected role skills and repo-native skills for this agent.",
    },
    {
      title: "No stale runtime configuration",
      description: "Removed models, disabled adapters, or stale homes should not remain referenced.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Clean obsolete runtime references and normalize homes/workspaces.",
    },
  ]),
  ...checksForAxis("skills_and_repos", [
    {
      title: "Company repos are mapped to projects",
      description: "The company should point to its real repos and workspaces.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Map company projects to the correct repo URLs or working directories.",
    },
    {
      title: "Repo-native skills are imported",
      description: "Specialized company work should come from the source repos where possible.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Import the company-specific GitHub-backed skills into the company catalog.",
    },
    {
      title: "Repo skills are attached to the right roles",
      description: "Imported skills are only useful if the intended agents can actually use them.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Bind repo-native skills to the CEO and relevant managers.",
    },
    {
      title: "No stale local shadow skills",
      description: "GitHub-backed keys should replace stale local-path shadow entries where possible.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Reconcile local-path shadows into canonical GitHub-backed skill keys.",
    },
    {
      title: "Shared skills do not crowd out company-specific work",
      description: "Generic skills should not be the only source of role guidance.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Balance shared operator skills with repo-native company skills.",
    },
  ]),
  ...checksForAxis("goals_projects_issues", [
    {
      title: "Goal tree is complete",
      description: "The company should have company, department, and role-aligned goals rather than vague placeholders.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Build or refine the goal tree with measurable objectives.",
    },
    {
      title: "Projects cover the actual operating streams",
      description: "Major workstreams should exist as explicit projects.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Create or refine the project layer to reflect how the company actually works.",
    },
    {
      title: "Governance baseline issues exist",
      description: "A serious company should have doctrine, approval rules, repo mapping, and review cadence documented.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Add baseline governance issues and issue docs.",
    },
    {
      title: "Issue system is reserved for meaningful intervention",
      description: "The company should not use issues as a junk drawer for low-signal work.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Move routine work into docs, runs, and approvals; keep issues for intervention-worthy work.",
    },
    {
      title: "Activation backlog is explicit",
      description: "The company should know what must be done before activation or next-stage expansion.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Create an activation backlog with blockers and next moves.",
    },
  ]),
  ...checksForAxis("governance", [
    {
      title: "Approval classes exist for risky actions",
      description: "Publish, spend, credentialed browser change, and regulated claim actions should have explicit review lanes.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Define and document the approval matrix for risky action classes.",
    },
    {
      title: "Review strength matches company risk",
      description: "Regulated or high-trust companies should have stronger controls than low-risk internal companies.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Increase or normalize governance depth to match the real domain risk.",
    },
    {
      title: "Missing reviewers are identified",
      description: "Approvals are only real if there is an actual reviewer path.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Assign the human or role responsible for each approval class.",
    },
    {
      title: "Controls are not over-bureaucratic",
      description: "Governance should protect the company without making ordinary work impossible.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Reduce unnecessary review depth for low-risk recurring work.",
    },
  ]),
  ...checksForAxis("connectors_accounts", [
    {
      title: "External accounts are company-scoped",
      description: "Each company should have explicit account records rather than hidden global defaults.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Register company-scoped account records for each meaningful external surface.",
    },
    {
      title: "Connector records map to real secrets",
      description: "Account records should reference the actual company secrets that power them.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Bind connector records to real company secret refs and remove fake placeholders.",
    },
    {
      title: "Provider coverage matches company needs",
      description: "A SaaS, media, or compliance company should not all have the same connector footprint.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Add the provider families this company actually needs to operate.",
    },
    {
      title: "Connector records are clearly labeled",
      description: "Operators should not have to guess which account belongs to which purpose.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Rename connector records to clear company-specific labels and channels.",
    },
    {
      title: "No stale or duplicate account records",
      description: "Old generic records should not clutter the company account surface.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Remove or normalize duplicate and stale account records.",
    },
  ]),
  ...checksForAxis("growth_surfaces", [
    {
      title: "Growth channel stack matches mission",
      description: "Public-facing companies should have the right growth surfaces wired and internal-only companies should stay lean.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Align channel setup to the actual company mission and go-to-market.",
    },
    {
      title: "Analytics surfaces are present where required",
      description: "Public products should not be blind to their own traffic and funnel behavior.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Add the appropriate analytics provider records and reporting surfaces.",
    },
    {
      title: "Email and support surfaces are explicit",
      description: "Support and operational email should be deliberate rather than improvised.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Provision and bind the right inboxes and operational mail surfaces.",
    },
  ]),
  ...checksForAxis("product_delivery", [
    {
      title: "Release and delivery path is explicit",
      description: "Product companies should know how work moves from issue to deployment.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Map release ownership, deploy path, and delivery checkpoints.",
    },
    {
      title: "Operations and quality surfaces are present",
      description: "Product companies should not lack the minimum review and operational layers.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Install or configure the relevant quality and operations plugins.",
    },
    {
      title: "Infrastructure accounts are mapped",
      description: "Platform surfaces such as Cloudflare, Render, Supabase, and similar should be explicit where relevant.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Add platform account records and tie them to company infrastructure ownership.",
    },
  ]),
  ...checksForAxis("safety_compliance", [
    {
      title: "Regulated claims are governed",
      description: "Medical, legal, finance, tax, or high-trust content should not bypass stronger controls.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Strengthen approval, disclosure, and evidence controls for regulated domains.",
    },
    {
      title: "Secret handling is company-safe",
      description: "Raw credentials should not leak across company lines or into generic runtime assumptions.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Move or normalize credentials into company-scoped secrets and refs.",
    },
    {
      title: "No dangerous noisy plugin remains active",
      description: "Broken or misconfigured plugins should not pollute a paused or safety-sensitive company.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Disable or repair noisy plugins before company activation.",
    },
  ]),
  ...checksForAxis("plugin_fit", [
    {
      title: "Plugin stack matches company type",
      description: "A company should have the plugins it needs, not a generic indiscriminate install set.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Add the missing high-value plugins and remove irrelevant ones.",
    },
    {
      title: "Installed plugins are configured enough to be useful",
      description: "A plugin that exists but is unconfigured should not be treated as full coverage.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Complete the minimum setup required for each installed plugin.",
    },
    {
      title: "Plugin UI surfaces render cleanly",
      description: "A broken widget is operational debt, not a feature.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Repair rendering failures and dead pages so the operator surface stays trustworthy.",
    },
  ]),
  ...checksForAxis("data_learning", [
    {
      title: "Learning loops exist where compounding matters",
      description: "Product, support, media, and growth companies should capture and reuse learnings.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Connect analytics, outcomes, and learning systems into the company loop.",
    },
    {
      title: "Memory is scoped correctly",
      description: "Learning and memory should compound without causing company boundary leakage.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Ensure memory and learning surfaces are company-safe and purpose-fit.",
    },
  ]),
  ...checksForAxis("activation_readiness", [
    {
      title: "Company can move independently",
      description: "The company should not depend on hidden platform assumptions to do its next useful work.",
      severity: "critical",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Close the explicit blockers that prevent independent execution.",
    },
    {
      title: "Next activation move is explicit",
      description: "The operator should not have to guess what happens next.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Define the first safe activation sequence for this company.",
    },
    {
      title: "Missing credentials are explicit blockers",
      description: "Missing accounts and secrets should show up as direct activation blockers instead of hidden latent debt.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Open credential-bound setup gaps for the missing external dependencies.",
    },
  ]),
  ...checksForAxis("operator_ux", [
    {
      title: "Operator surfaces are prominent",
      description: "Master Chat, key dashboards, and high-signal pages should be easy to find.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Promote high-value surfaces and reduce navigation friction.",
    },
    {
      title: "Dashboard signals are actionable",
      description: "Warnings should mean something concrete, not vague noise.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Replace generic or broken widgets with actionable summaries.",
    },
    {
      title: "Setup flows are low-friction",
      description: "Connector, email, and company-control tasks should not require excessive operator guesswork.",
      severity: "medium",
      issueWhenHumanActionNeeded: false,
      blocksActivation: false,
      suggestedFix: "Improve preset flows, labels, and guidance around common setup tasks.",
    },
  ]),
  ...checksForAxis("efficiency_cost", [
    {
      title: "Company is not overbuilt for its stage",
      description: "Too much structure or too many surfaces too early creates drag.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Reduce unnecessary roles, plugins, or complexity that do not yet create value.",
    },
    {
      title: "Company is not underbuilt for its ambition",
      description: "Ambitious live companies should not be missing basic operating layers.",
      severity: "high",
      issueWhenHumanActionNeeded: true,
      blocksActivation: true,
      suggestedFix: "Add the missing minimum viable operating surfaces for this stage.",
    },
    {
      title: "Agent and plugin cost posture is explicit",
      description: "Runtime and plugin choice should not create hidden waste.",
      severity: "medium",
      issueWhenHumanActionNeeded: true,
      blocksActivation: false,
      suggestedFix: "Review budgets, runtime allocations, and plugin footprint for waste.",
    },
  ]),
];

function statusForSeverity(severity: OptimizationCheckDefinition["severity"]): CheckStatus {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "failing";
    case "medium":
      return "warning";
    default:
      return "pass";
  }
}

function scoreFromCounts(total: number, warning: number, failing: number, critical: number) {
  if (total === 0) return 100;
  const penalty = warning * 5 + failing * 12 + critical * 20;
  return Math.max(0, Math.min(100, Math.round(100 - penalty / total)));
}

export function buildScaffoldReport(companyId: string | null): CompanyOptimizationReport {
  const checkedAt = new Date().toISOString();
  const findings: OptimizationFinding[] = CHECK_CATALOG.map((check) => ({
    ...check,
    status: statusForSeverity(check.severity),
    evidence: "Scaffold mode: this rule is present and ready to be wired to live Paperclip state.",
  }));

  const axisSummaries: OptimizationAxisSummary[] = (Object.keys(AXIS_LABELS) as OptimizationAxis[]).map((axis) => {
    const axisFindings = findings.filter((finding) => finding.axis === axis);
    const passCount = axisFindings.filter((finding) => finding.status === "pass").length;
    const warningCount = axisFindings.filter((finding) => finding.status === "warning").length;
    const failingCount = axisFindings.filter((finding) => finding.status === "failing").length;
    const criticalCount = axisFindings.filter((finding) => finding.status === "critical").length;
    return {
      axis,
      totalChecks: axisFindings.length,
      passCount,
      warningCount,
      failingCount,
      criticalCount,
      score: scoreFromCounts(axisFindings.length, warningCount, failingCount, criticalCount),
    };
  });

  const scorecard: OptimizationScorecard = {
    overall: Math.round(axisSummaries.reduce((sum, axis) => sum + axis.score, 0) / axisSummaries.length),
    readiness: Math.round(
      axisSummaries
        .filter((axis) => ["activation_readiness", "goals_projects_issues", "agent_runtime"].includes(axis.axis))
        .reduce((sum, axis) => sum + axis.score, 0) / 3,
    ),
    safety: Math.round(
      axisSummaries
        .filter((axis) => ["safety_compliance", "governance", "connectors_accounts"].includes(axis.axis))
        .reduce((sum, axis) => sum + axis.score, 0) / 3,
    ),
    independence: Math.round(
      axisSummaries
        .filter((axis) => ["activation_readiness", "connectors_accounts", "skills_and_repos"].includes(axis.axis))
        .reduce((sum, axis) => sum + axis.score, 0) / 3,
    ),
    governance: axisSummaries.find((axis) => axis.axis === "governance")?.score ?? 0,
    executionReadiness: Math.round(
      axisSummaries
        .filter((axis) => ["agent_runtime", "product_delivery", "goals_projects_issues"].includes(axis.axis))
        .reduce((sum, axis) => sum + axis.score, 0) / 3,
    ),
    connectorCoverage: axisSummaries.find((axis) => axis.axis === "connectors_accounts")?.score ?? 0,
    usability: axisSummaries.find((axis) => axis.axis === "operator_ux")?.score ?? 0,
    compounding: Math.round(
      axisSummaries
        .filter((axis) => ["data_learning", "skills_and_repos", "growth_surfaces"].includes(axis.axis))
        .reduce((sum, axis) => sum + axis.score, 0) / 3,
    ),
  };

  const issueCandidates: SetupIssueCandidate[] = findings
    .filter((finding) => finding.issueWhenHumanActionNeeded && finding.status !== "pass")
    .slice(0, 12)
    .map((finding) => ({
      key: finding.id,
      title: `Setup gap: ${finding.title}`,
      axis: finding.axis,
      severity: finding.severity,
      whyItMatters: finding.description,
      suggestedResolution: finding.suggestedFix,
      blocksActivation: finding.blocksActivation,
    }));

  return {
    companyId,
    mode: "scaffold",
    checkedAt,
    scorecard,
    axisSummaries,
    findings,
    issueCandidates,
  };
}

export function summarizeBlockers(report: CompanyOptimizationReport) {
  return report.issueCandidates.filter((candidate) => candidate.blocksActivation || candidate.severity === "critical");
}
