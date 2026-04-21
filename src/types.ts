export type OptimizationAxis =
  | "identity"
  | "org_structure"
  | "agent_runtime"
  | "skills_and_repos"
  | "goals_projects_issues"
  | "governance"
  | "connectors_accounts"
  | "growth_surfaces"
  | "product_delivery"
  | "safety_compliance"
  | "plugin_fit"
  | "data_learning"
  | "activation_readiness"
  | "operator_ux"
  | "efficiency_cost";

export type CheckSeverity = "low" | "medium" | "high" | "critical";
export type CheckStatus = "pass" | "warning" | "failing" | "critical";

export interface OptimizationCheckDefinition {
  id: string;
  axis: OptimizationAxis;
  title: string;
  description: string;
  severity: CheckSeverity;
  issueWhenHumanActionNeeded: boolean;
  blocksActivation: boolean;
  suggestedFix: string;
}

export interface OptimizationFinding extends OptimizationCheckDefinition {
  status: CheckStatus;
  evidence: string;
}

export interface OptimizationAxisSummary {
  axis: OptimizationAxis;
  totalChecks: number;
  passCount: number;
  warningCount: number;
  failingCount: number;
  criticalCount: number;
  score: number;
}

export interface OptimizationScorecard {
  overall: number;
  readiness: number;
  safety: number;
  independence: number;
  governance: number;
  executionReadiness: number;
  connectorCoverage: number;
  usability: number;
  compounding: number;
}

export interface SetupIssueCandidate {
  key: string;
  title: string;
  axis: OptimizationAxis;
  severity: CheckSeverity;
  whyItMatters: string;
  suggestedResolution: string;
  blocksActivation: boolean;
}

export interface CompanyOptimizationReport {
  companyId: string | null;
  mode: "scaffold";
  checkedAt: string;
  scorecard: OptimizationScorecard;
  axisSummaries: OptimizationAxisSummary[];
  findings: OptimizationFinding[];
  issueCandidates: SetupIssueCandidate[];
}

