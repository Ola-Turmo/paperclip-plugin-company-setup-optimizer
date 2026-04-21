import type { Agent, Company, Goal, Issue, PluginWorkspace, Project } from "@paperclipai/plugin-sdk";

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
  source: "sdk" | "browser_snapshot" | "hybrid" | "inference";
  suppressed?: boolean;
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
  existingIssueId?: string | null;
}

export interface BrowserPluginSnapshot {
  id: string;
  pluginKey: string;
  version: string;
  status: string;
  displayName: string;
  lastError: string | null;
  installOrder: number | null;
}

export interface BrowserCompanySkillSnapshot {
  id: string;
  key: string;
  slug: string;
  sourceType: string;
  sourceRef: string | null;
  attachedAgentCount: number;
  compatibility: string | null;
}

export interface BrowserSecretSnapshot {
  id: string;
  name: string;
  provider: string;
  description: string | null;
}

export interface BrowserConnectorRecordSnapshot {
  id: string;
  providerId: string;
  label: string;
  accountIdentifier: string;
  usage: string;
  status: string;
  secretRefs: {
    primary?: string;
    refresh?: string;
    webhook?: string;
  };
}

export interface BrowserConnectorSummarySnapshot {
  totalConnections: number;
  statusCounts: Record<string, number>;
  usageCounts: Record<string, number>;
  providerCounts: Record<string, number>;
  warnings: string[];
}

export interface BrowserAgentSkillEntrySnapshot {
  key: string;
  desired: boolean;
  managed: boolean;
  state: string;
}

export interface BrowserAgentSkillsSnapshot {
  agentId: string;
  supported: boolean;
  adapterType: string;
  desiredSkills: string[];
  entries: BrowserAgentSkillEntrySnapshot[];
  warnings: string[];
}

export interface CompanyBrowserSnapshot {
  companyId: string;
  capturedAt: string;
  plugins: BrowserPluginSnapshot[];
  companySkills: BrowserCompanySkillSnapshot[];
  secrets: BrowserSecretSnapshot[];
  connectors: {
    summary: BrowserConnectorSummarySnapshot | null;
    connections: BrowserConnectorRecordSnapshot[];
  };
  agentSkills: BrowserAgentSkillsSnapshot[];
}

export interface CompanyProfile {
  companyId: string;
  companyName: string;
  prefix: string | null;
  tags: Array<
    | "personal"
    | "education"
    | "legal"
    | "compliance"
    | "platform"
    | "saas"
    | "health"
    | "agency"
    | "media"
    | "public"
    | "regulated"
    | "growth"
    | "internal"
  >;
  expectsStandardOrg: boolean;
  expectsAgencyOrg: boolean;
  needsSocialStack: boolean;
  needsAnalytics: boolean;
  needsProductInfra: boolean;
  needsQualityGate: boolean;
  needsLearning: boolean;
}

export interface WorkerCompanySnapshot {
  company: Company;
  agents: Agent[];
  goals: Goal[];
  issues: Issue[];
  projects: Array<Project & { pluginWorkspaces: PluginWorkspace[] }>;
  browserSnapshot: CompanyBrowserSnapshot | null;
  generatedAt: string;
}

export interface CompanyOptimizationReport {
  companyId: string | null;
  mode: "live";
  checkedAt: string;
  profile: CompanyProfile | null;
  snapshotFreshnessHours: number | null;
  scorecard: OptimizationScorecard;
  axisSummaries: OptimizationAxisSummary[];
  findings: OptimizationFinding[];
  issueCandidates: SetupIssueCandidate[];
  stats: {
    agentCount: number;
    projectCount: number;
    goalCount: number;
    issueCount: number;
    openIssueCount: number;
    companySkillCount: number | null;
    connectorCount: number | null;
    secretCount: number | null;
  };
}

export interface PortfolioOptimizationSummaryItem {
  companyId: string;
  companyName: string;
  overallScore: number;
  criticalCount: number;
  failingCount: number;
  issueCandidateCount: number;
  readiness: number;
  safety: number;
}

export interface PortfolioOptimizationSummary {
  checkedAt: string;
  companies: PortfolioOptimizationSummaryItem[];
}

export interface OptimizerCompanyState {
  suppressedFindingIds: string[];
  materializedIssues: Record<string, string>;
}
