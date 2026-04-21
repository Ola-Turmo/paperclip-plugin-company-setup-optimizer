import type {
  CheckStatus,
  CheckSeverity,
  CompanyOptimizationReport,
  OptimizationAxis,
  OptimizationAxisSummary,
  OptimizationCheckDefinition,
  OptimizationScorecard,
} from "./types.js";

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

function def(
  id: string,
  axis: OptimizationAxis,
  title: string,
  description: string,
  severity: CheckSeverity,
  issueWhenHumanActionNeeded: boolean,
  blocksActivation: boolean,
  suggestedFix: string,
): OptimizationCheckDefinition {
  return { id, axis, title, description, severity, issueWhenHumanActionNeeded, blocksActivation, suggestedFix };
}

export const CHECK_DEFINITIONS: Record<string, OptimizationCheckDefinition> = Object.fromEntries(
  [
    def("identity.description_present", "identity", "Company description is explicit", "The company should have a real mission description rather than an empty or placeholder summary.", "high", true, true, "Write a precise company mission and operating summary."),
    def("identity.branding_present", "identity", "Branding is representative", "The company should have usable branding signals such as logo and brand color for operator clarity.", "medium", true, false, "Attach a representative logo and brand color."),
    def("identity.issue_prefix_present", "identity", "Issue prefix exists", "Every company should have a short issue identifier prefix for clean issue discipline.", "medium", true, false, "Set a stable issue prefix."),
    def("identity.scope_clear", "identity", "Scope boundaries are clear", "The company should have a clear differentiated purpose from the other companies in the portfolio.", "high", true, false, "Document the company boundary and why it exists."),

    def("org.single_ceo", "org_structure", "Exactly one CEO exists", "Every company should have one and only one CEO-rooted control point.", "critical", true, true, "Create or normalize a single CEO agent."),
    def("org.expected_role_coverage", "org_structure", "Expected role coverage exists", "The company should have the right manager coverage for its type.", "high", true, true, "Create the missing role coverage or document why it is intentionally absent."),
    def("org.no_orphans", "org_structure", "No orphan agents exist", "Every non-CEO agent should report to exactly one manager.", "critical", true, true, "Repair the org chart reporting lines."),
    def("org.shallow_hierarchy", "org_structure", "Hierarchy remains shallow", "The org chart should be explicit and simple enough to operate clearly.", "medium", true, false, "Flatten unnecessary reporting layers."),
    def("org.unique_agent_names", "org_structure", "Agent names are unique", "Operators should not have to disambiguate duplicate agent names within a company.", "medium", true, false, "Rename duplicated agents."),

    def("runtime.non_placeholder_adapters", "agent_runtime", "Agents use real adapters", "A company cannot be considered optimized if it still relies on placeholder adapters for real work.", "critical", true, true, "Assign real adapters to every agent."),
    def("runtime.cwd_present", "agent_runtime", "Agent working directories are configured", "Agents should operate inside explicit company workspaces.", "high", true, true, "Set adapter cwd values per agent."),
    def("runtime.model_present", "agent_runtime", "Adapter models are explicit", "AI runtimes should be configured with explicit model choices.", "medium", true, false, "Set the intended model per adapter."),
    def("runtime.budget_explicit", "agent_runtime", "Agent budgets are explicit", "Agents should not all inherit an implicit unlimited stance by accident.", "high", true, false, "Set clear per-agent budget policy."),
    def("runtime.skill_runtime_supported", "agent_runtime", "Skill runtime is healthy", "Agent skill materialization should be supported for the assigned adapter.", "high", true, false, "Repair adapter-to-skill integration."),
    def("runtime.home_isolated", "agent_runtime", "Agent homes are isolated where needed", "Per-agent runtime isolation reduces collision and leakage risk.", "medium", false, false, "Use isolated homes for agents that support them."),

    def("skills.company_skills_present", "skills_and_repos", "Company skills are present", "The company should have a meaningful skill catalog rather than just bundled defaults.", "high", true, true, "Import the relevant company and shared skills."),
    def("skills.github_backed_present", "skills_and_repos", "GitHub-backed repo skills exist", "Company-specific work should be grounded in repo-native GitHub-backed skills where possible.", "high", true, true, "Import GitHub-backed company repo skills."),
    def("skills.repo_skills_attached", "skills_and_repos", "Repo skills are attached to the right agents", "Imported skills are only useful if the intended agents can use them.", "high", true, false, "Attach repo skills to the relevant managers and CEO."),
    def("skills.no_agent_skill_warnings", "skills_and_repos", "Agent skill warnings are clear", "A company is not optimized if agent skill snapshots still warn about missing or broken skill state.", "high", true, false, "Repair the warned agent skill states."),
    def("skills.project_workspaces_present", "skills_and_repos", "Project workspaces are mapped", "Projects should point to actual repo/workspace surfaces.", "high", true, true, "Map projects to real workspaces."),
    def("skills.primary_workspace_present", "skills_and_repos", "Projects have primary workspaces", "Each project should have a clear primary workspace.", "medium", true, false, "Set a primary workspace for each project."),

    def("planning.goal_tree_present", "goals_projects_issues", "Goal tree exists", "The company should have company, team, and agent-level goals.", "high", true, true, "Create the missing goals."),
    def("planning.projects_present", "goals_projects_issues", "Projects exist", "Major workstreams should be modeled as projects.", "high", true, true, "Add projects for the real workstreams."),
    def("planning.governance_issues_present", "goals_projects_issues", "Governance baseline issues exist", "Doctrine, approvals, repo mapping, and review-loop issues should be present.", "high", true, false, "Create the governance baseline issues."),
    def("planning.activation_issues_present", "goals_projects_issues", "Activation issues exist", "The company should explicitly track activation readiness and next-step sequence.", "high", true, true, "Add activation and independence issues."),
    def("planning.issue_noise_controlled", "goals_projects_issues", "Issue system is not noisy", "Issues should be reserved for meaningful operator intervention.", "medium", true, false, "Reduce low-signal issue creation and prefer docs/approvals for routine work."),

    def("governance.board_approval_enabled", "governance", "Board approval is enabled for new agents", "New agent creation should stay gated by default unless intentionally loosened.", "high", true, true, "Enable company-level board approval for new agents."),
    def("governance.approval_matrix_exists", "governance", "Approval matrix exists", "High-stakes actions should have a documented approval matrix.", "critical", true, true, "Add the approval matrix and high-stakes rules."),
    def("governance.regulated_review_strength", "governance", "Review strength matches company risk", "Regulated and trust-sensitive companies need stronger review defaults.", "high", true, true, "Increase review controls for the risky company type."),

    def("connectors.snapshot_present", "connectors_accounts", "Connector snapshot exists", "The optimizer cannot fully evaluate company account setup without current host-side connector metadata.", "medium", false, false, "Refresh the browser snapshot from the plugin page."),
    def("connectors.github_present", "connectors_accounts", "GitHub account is mapped", "Each company should have an explicit GitHub engineering record.", "high", true, true, "Create a company-scoped GitHub connector record."),
    def("connectors.records_clear", "connectors_accounts", "Connector warnings are clear", "Connector records should not be duplicated, stale, or warning-heavy.", "high", true, false, "Normalize or remove stale connector records."),
    def("connectors.secret_metadata_present", "connectors_accounts", "Secret metadata is present", "Company account setup should be grounded in explicit company secrets.", "high", true, true, "Add the missing company-scoped secrets."),
    def("connectors.provider_fit", "connectors_accounts", "Provider coverage matches company needs", "The external account stack should fit the company type, not just be generic.", "high", true, false, "Add the provider surfaces that fit this company."),

    def("growth.channel_fit", "growth_surfaces", "Communications stack matches mission", "Public-facing companies should have the right communications surfaces configured.", "medium", true, false, "Add the missing email, social, or support surfaces."),
    def("growth.analytics_fit", "growth_surfaces", "Analytics stack matches mission", "Growth-facing companies should not be blind to their own performance surfaces.", "medium", true, false, "Add analytics connectors that fit the company."),

    def("delivery.codebase_present", "product_delivery", "Product projects have codebase coverage", "Product and platform companies should have explicit codebase/workspace coverage.", "high", true, true, "Attach codebase workspaces to the product projects."),
    def("delivery.quality_ops_ready", "product_delivery", "Quality and operations layers are available", "Product companies should have quality and operations surfaces installed and healthy.", "high", true, false, "Install or repair the quality and operations plugin layer."),
    def("delivery.platform_accounts_fit", "product_delivery", "Platform accounts fit the product stack", "SaaS and platform companies should have explicit deployment and backend account coverage.", "high", true, false, "Connect the needed Cloudflare/Render/Supabase/Clerk/Convex/Stripe/PostHog accounts."),

    def("safety.regulated_controls_fit", "safety_compliance", "Regulated controls fit the company", "Regulated companies need stronger review and evidence defaults.", "critical", true, true, "Tighten quality, approval, and evidence controls."),
    def("safety.secret_isolation_fit", "safety_compliance", "Secrets are company-safe", "Secrets and external accounts should not bleed across company boundaries implicitly.", "critical", true, true, "Move or normalize secrets into company-scoped refs."),
    def("safety.required_plugins_not_broken", "safety_compliance", "Required plugins are not broken", "A required plugin in failed or noisy state undermines the company setup.", "high", true, false, "Repair or disable the broken plugin."),

    def("plugins.master_chat_ready", "plugin_fit", "Master Chat is ready", "The main operator surface should be installed and healthy.", "medium", true, false, "Install or repair Master Chat."),
    def("plugins.aperture_ready", "plugin_fit", "Aperture is ready", "The attention layer should be available to keep multi-company work sane.", "medium", true, false, "Install or repair Aperture."),
    def("plugins.connectors_ready", "plugin_fit", "Connectors plugin is ready", "Connector policy and account mapping should be available.", "high", true, true, "Install or repair the connectors plugin."),
    def("plugins.company_specific_fit", "plugin_fit", "Company-specific plugin fit is strong", "The company should have the plugin stack that fits its category.", "medium", true, false, "Add the missing high-value plugins for this company."),

    def("learning.learning_surface_fit", "data_learning", "Learning surfaces fit the company", "Companies that should compound knowledge need explicit learning surfaces.", "medium", true, false, "Enable and connect learning surfaces that fit this company."),
    def("learning.skill_reuse_fit", "data_learning", "Skill reuse can compound", "The company should have reusable skills rather than only ad hoc role prompts.", "medium", true, false, "Add or strengthen reusable repo and role skills."),

    def("activation.independence_contract_present", "activation_readiness", "Independence contract exists", "The company should explicitly state how it can move independently.", "high", true, true, "Create an Independent Operating Contract issue."),
    def("activation.first_safe_sequence_present", "activation_readiness", "First safe activation sequence exists", "The company should have an explicit next-step activation plan.", "high", true, true, "Create a First Safe Activation Sequence issue."),
    def("activation.company_can_move_forward", "activation_readiness", "Company can move forward independently", "Independent operation should be possible without hidden assumptions.", "critical", true, true, "Close the blockers that prevent independent movement."),

    def("ux.operator_navigation_fit", "operator_ux", "Operator navigation is clear", "Branding and navigation should make the company easy to operate.", "low", true, false, "Improve logo, labels, and layout signals."),
    def("ux.operator_surfaces_prominent", "operator_ux", "Operator surfaces are prominent", "Master Chat and key controls should be easy to find.", "medium", true, false, "Promote the most important operator surfaces."),
    def("ux.snapshot_freshness", "operator_ux", "Optimizer snapshot is fresh", "Host-side snapshot data should be fresh enough to trust.", "low", false, false, "Refresh the browser snapshot from the optimizer page."),

    def("efficiency.budget_posture_fit", "efficiency_cost", "Budget posture is explicit", "The company should not implicitly rely on unclear budget posture.", "medium", true, false, "Set explicit budget guardrails or document the intentional posture."),
    def("efficiency.not_overbuilt", "efficiency_cost", "Company is not overbuilt for its stage", "Too much structure too early creates drag.", "low", true, false, "Reduce unnecessary layers that do not yet create value."),
    def("efficiency.not_underbuilt", "efficiency_cost", "Company is not underbuilt for its ambition", "Ambitious companies should not be missing minimum viable operating layers.", "high", true, true, "Add the missing setup layers required for the company’s real ambition."),
  ].map((item) => [item.id, item]),
);

export function scoreAxis(statuses: CheckStatus[]) {
  if (statuses.length === 0) return 100;
  const penalty = statuses.reduce((sum, status) => {
    if (status === "warning") return sum + 10;
    if (status === "failing") return sum + 22;
    if (status === "critical") return sum + 35;
    return sum;
  }, 0);
  return Math.max(0, Math.min(100, Math.round(100 - penalty / Math.max(1, statuses.length))));
}

export function buildAxisSummaries(report: Pick<CompanyOptimizationReport, "findings">): OptimizationAxisSummary[] {
  return (Object.keys(AXIS_LABELS) as OptimizationAxis[]).map((axis) => {
    const axisFindings = report.findings.filter((finding) => finding.axis === axis && !finding.suppressed);
    const statuses = axisFindings.map((finding) => finding.status);
    return {
      axis,
      totalChecks: axisFindings.length,
      passCount: statuses.filter((status) => status === "pass").length,
      warningCount: statuses.filter((status) => status === "warning").length,
      failingCount: statuses.filter((status) => status === "failing").length,
      criticalCount: statuses.filter((status) => status === "critical").length,
      score: scoreAxis(statuses),
    };
  });
}

export function buildScorecard(axisSummaries: OptimizationAxisSummary[]): OptimizationScorecard {
  const scoreFor = (...axes: OptimizationAxis[]) =>
    Math.round(
      axes
        .map((axis) => axisSummaries.find((summary) => summary.axis === axis)?.score ?? 0)
        .reduce((sum, value) => sum + value, 0) / axes.length,
    );

  return {
    overall: Math.round(axisSummaries.reduce((sum, axis) => sum + axis.score, 0) / axisSummaries.length),
    readiness: scoreFor("activation_readiness", "goals_projects_issues", "agent_runtime"),
    safety: scoreFor("safety_compliance", "governance", "connectors_accounts"),
    independence: scoreFor("activation_readiness", "connectors_accounts", "skills_and_repos"),
    governance: scoreFor("governance"),
    executionReadiness: scoreFor("agent_runtime", "product_delivery", "goals_projects_issues"),
    connectorCoverage: scoreFor("connectors_accounts"),
    usability: scoreFor("operator_ux"),
    compounding: scoreFor("data_learning", "skills_and_repos", "growth_surfaces"),
  };
}
