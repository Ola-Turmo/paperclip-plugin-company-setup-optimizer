import * as React from "react";
import { useState, type CSSProperties } from "react";
import {
  useHostContext,
  usePluginAction,
  usePluginData,
  usePluginToast,
  type PluginPageProps,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import { AXIS_LABELS } from "../catalog.js";
import type {
  BrowserAgentSkillsSnapshot,
  BrowserCompanySkillSnapshot,
  BrowserConnectorRecordSnapshot,
  BrowserConnectorSummarySnapshot,
  BrowserPluginSnapshot,
  BrowserSecretSnapshot,
  CompanyBrowserSnapshot,
  CompanyOptimizationReport,
  PortfolioOptimizationSummary,
  SetupIssueCandidate,
} from "../types.js";

const CARD: CSSProperties = {
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.95)",
};

const GRID_4: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0,1fr))",
  gap: 12,
};

const SCORE: CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  lineHeight: 1,
};

function statusColor(status: string) {
  if (status === "critical") return "#b91c1c";
  if (status === "failing") return "#c2410c";
  if (status === "warning") return "#b45309";
  return "#166534";
}

function companyParams(companyId?: string | null) {
  return companyId ? { companyId } : {};
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return await response.json() as T;
}

async function collectBrowserSnapshot(companyId: string): Promise<CompanyBrowserSnapshot> {
  const plugins = await fetchJson<Array<{
    id: string;
    pluginKey: string;
    version: string;
    status: string;
    lastError?: string | null;
    installOrder?: number | null;
    manifestJson?: { displayName?: string };
  }>>("/api/plugins");
  const [skills, secrets, agents] = await Promise.all([
    fetchJson<BrowserCompanySkillSnapshot[]>(`/api/companies/${companyId}/skills`),
    fetchJson<BrowserSecretSnapshot[]>(`/api/companies/${companyId}/secrets`),
    fetchJson<Array<{ id: string }>>(`/api/companies/${companyId}/agents`),
  ]);

  const agentSkills: BrowserAgentSkillsSnapshot[] = await Promise.all(
    agents.map(async (agent) => {
      const payload = await fetchJson<Omit<BrowserAgentSkillsSnapshot, "agentId"> & { warnings?: string[] }>(`/api/agents/${agent.id}/skills`);
      return {
        agentId: agent.id,
        supported: payload.supported,
        adapterType: payload.adapterType,
        desiredSkills: payload.desiredSkills,
        entries: payload.entries,
        warnings: payload.warnings ?? [],
      };
    }),
  );

  const connectorsPlugin = plugins.find((plugin) => plugin.pluginKey === "uos.plugin-connectors");
  let connectorsSummary: BrowserConnectorSummarySnapshot | null = null;
  let connectorsRecords: BrowserConnectorRecordSnapshot[] = [];

  if (connectorsPlugin) {
    const bridgeResponse = await fetchJson<{ data: { companyId: string; connections: BrowserConnectorRecordSnapshot[]; summary: BrowserConnectorSummarySnapshot } }>(
      `/api/plugins/${connectorsPlugin.id}/bridge/data`,
      {
        method: "POST",
        body: JSON.stringify({
          key: "companyConnections",
          companyId,
          params: { companyId },
        }),
      },
    );
    connectorsSummary = bridgeResponse.data.summary;
    connectorsRecords = bridgeResponse.data.connections;
  }

  return {
    companyId,
    capturedAt: new Date().toISOString(),
    plugins: plugins.map((plugin) => ({
      id: plugin.id,
      pluginKey: plugin.pluginKey,
      version: plugin.version,
      status: plugin.status,
      displayName: plugin.manifestJson?.displayName ?? plugin.pluginKey,
      lastError: plugin.lastError ?? null,
      installOrder: plugin.installOrder ?? null,
    })),
    companySkills: skills.map((skill) => ({
      id: skill.id,
      key: skill.key,
      slug: skill.slug,
      sourceType: skill.sourceType,
      sourceRef: skill.sourceRef ?? null,
      attachedAgentCount: skill.attachedAgentCount,
      compatibility: skill.compatibility ?? null,
    })),
    secrets: secrets.map((secret) => ({
      id: secret.id,
      name: secret.name,
      provider: secret.provider,
      description: secret.description ?? null,
    })),
    connectors: {
      summary: connectorsSummary,
      connections: connectorsRecords,
    },
    agentSkills,
  };
}

function ScoreCards(props: { report: CompanyOptimizationReport }) {
  return (
    <div style={GRID_4}>
      <div style={CARD}>
        <div style={{ color: "#64748b", fontSize: 12 }}>Overall</div>
        <div style={SCORE}>{props.report.scorecard.overall}</div>
      </div>
      <div style={CARD}>
        <div style={{ color: "#64748b", fontSize: 12 }}>Readiness</div>
        <div style={SCORE}>{props.report.scorecard.readiness}</div>
      </div>
      <div style={CARD}>
        <div style={{ color: "#64748b", fontSize: 12 }}>Safety</div>
        <div style={SCORE}>{props.report.scorecard.safety}</div>
      </div>
      <div style={CARD}>
        <div style={{ color: "#64748b", fontSize: 12 }}>Independence</div>
        <div style={SCORE}>{props.report.scorecard.independence}</div>
      </div>
    </div>
  );
}

function FindingsList(props: {
  report: CompanyOptimizationReport;
  onDismiss: (findingId: string) => Promise<void>;
  onOpenIssue: (key: string) => Promise<void>;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {props.report.findings
        .filter((finding) => !finding.suppressed)
        .sort((left, right) => {
          const order = { critical: 0, failing: 1, warning: 2, pass: 3 };
          return order[left.status] - order[right.status];
        })
        .map((finding) => (
          <div key={finding.id} style={{ ...CARD, borderColor: `${statusColor(finding.status)}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{finding.title}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: statusColor(finding.status) }}>
                  {AXIS_LABELS[finding.axis]} · {finding.status} · {finding.severity}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                {finding.status !== "pass" && finding.issueWhenHumanActionNeeded ? (
                  <button onClick={() => void props.onOpenIssue(finding.id)}>Open issue</button>
                ) : null}
                <button onClick={() => void props.onDismiss(finding.id)}>Dismiss</button>
              </div>
            </div>
            <div style={{ marginTop: 10, color: "#334155" }}>{finding.description}</div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 13 }}>{finding.evidence}</div>
            <div style={{ marginTop: 8, color: "#0f766e", fontSize: 13 }}>Fix: {finding.suggestedFix}</div>
          </div>
        ))}
    </div>
  );
}

function IssueCandidateList(props: {
  candidates: SetupIssueCandidate[];
  onOpenIssue: (key: string) => Promise<void>;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.candidates.map((candidate) => (
        <div key={candidate.key} style={{ ...CARD, background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{candidate.title}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>
                {AXIS_LABELS[candidate.axis]} · {candidate.severity} · {candidate.blocksActivation ? "blocks activation" : "optimization issue"}
              </div>
            </div>
            <button onClick={() => void props.onOpenIssue(candidate.key)}>
              {candidate.existingIssueId ? "Refresh issue" : "Open issue"}
            </button>
          </div>
          <div style={{ marginTop: 8, color: "#334155" }}>{candidate.whyItMatters}</div>
        </div>
      ))}
    </div>
  );
}

export function DashboardWidget(_props: PluginWidgetProps) {
  const context = useHostContext();
  const report = usePluginData<CompanyOptimizationReport>("companyOptimizationReport", companyParams(context.companyId));

  if (!context.companyId) return <div>Open inside a company to use Setup Optimizer.</div>;
  if (report.loading) return <div>Loading setup optimizer…</div>;
  if (report.error) return <div>Setup Optimizer error: {report.error.message}</div>;
  if (!report.data) return <div>No optimizer report.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong>Setup Optimizer</strong>
      <div>Overall {report.data.scorecard.overall}/100</div>
      <div>{report.data.issueCandidates.length} issue-worthy gaps</div>
      <div>{report.data.issueCandidates.filter((item) => item.blocksActivation).length} blockers</div>
      <div>{report.data.snapshotFreshnessHours == null ? "No browser snapshot" : `Snapshot age ${report.data.snapshotFreshnessHours.toFixed(1)}h`}</div>
    </div>
  );
}

export function CompanySetupOptimizerPage(_props: PluginPageProps) {
  const context = useHostContext();
  const toast = usePluginToast();
  const companyId = context.companyId;

  const report = usePluginData<CompanyOptimizationReport>("companyOptimizationReport", companyParams(companyId));
  const portfolio = usePluginData<PortfolioOptimizationSummary>("portfolioOptimizationSummary", {});
  const snapshotStatus = usePluginData<{
    present: boolean;
    capturedAt: string | null;
    pluginCount: number;
    skillCount: number;
    connectorCount: number;
    secretCount: number;
    agentSkillCount: number;
  }>("companyBrowserSnapshotStatus", companyParams(companyId));

  const saveBrowserSnapshot = usePluginAction("saveBrowserSnapshot");
  const dismissFinding = usePluginAction("dismissFinding");
  const materializeIssue = usePluginAction("materializeIssueCandidate");
  const materializeIssues = usePluginAction("materializeIssueCandidates");

  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [bulkIssueBusy, setBulkIssueBusy] = useState(false);

  async function refreshSnapshot() {
    if (!companyId) return;
    setSnapshotBusy(true);
    try {
      const snapshot = await collectBrowserSnapshot(companyId);
      await saveBrowserSnapshot({ companyId, snapshot });
      toast({ title: "Optimizer snapshot refreshed", body: `Captured ${snapshot.plugins.length} plugins and ${snapshot.companySkills.length} skills.`, tone: "success" });
      report.refresh();
      snapshotStatus.refresh();
      portfolio.refresh();
    } catch (error) {
      toast({ title: "Snapshot refresh failed", body: error instanceof Error ? error.message : "Unknown error", tone: "error" });
    } finally {
      setSnapshotBusy(false);
    }
  }

  async function handleDismiss(findingId: string) {
    if (!companyId) return;
    try {
      await dismissFinding({ companyId, findingId });
      toast({ title: "Finding dismissed", tone: "success" });
      report.refresh();
    } catch (error) {
      toast({ title: "Dismiss failed", body: error instanceof Error ? error.message : "Unknown error", tone: "error" });
    }
  }

  async function handleOpenIssue(key: string) {
    if (!companyId) return;
    try {
      await materializeIssue({ companyId, key });
      toast({ title: "Setup issue created", tone: "success" });
      report.refresh();
    } catch (error) {
      toast({ title: "Issue creation failed", body: error instanceof Error ? error.message : "Unknown error", tone: "error" });
    }
  }

  async function handleBulkIssues() {
    if (!companyId) return;
    setBulkIssueBusy(true);
    try {
      const result = await materializeIssues({ companyId, threshold: "high" }) as { total: number };
      toast({ title: "Optimizer issues materialized", body: `${result.total} issue(s) created or refreshed.`, tone: "success" });
      report.refresh();
    } catch (error) {
      toast({ title: "Bulk issue creation failed", body: error instanceof Error ? error.message : "Unknown error", tone: "error" });
    } finally {
      setBulkIssueBusy(false);
    }
  }

  if (!companyId) {
    if (portfolio.loading) return <div style={{ padding: 16 }}>Loading portfolio optimizer…</div>;
    if (portfolio.error) return <div style={{ padding: 16 }}>Portfolio optimizer error: {portfolio.error.message}</div>;
    return (
      <div style={{ display: "grid", gap: 16, padding: 16 }}>
        <div style={CARD}>
          <strong>Portfolio Setup Optimizer</strong>
          <div style={{ marginTop: 8, color: "#475569" }}>
            Open a company to inspect and optimize its full setup. The portfolio view below shows current comparative scores.
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {(portfolio.data?.companies ?? []).map((company) => (
            <div key={company.companyId} style={CARD}>
              <div style={{ fontWeight: 700 }}>{company.companyName}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                overall {company.overallScore} · readiness {company.readiness} · safety {company.safety}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                critical {company.criticalCount} · failing {company.failingCount} · issue candidates {company.issueCandidateCount}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (report.loading) return <div style={{ padding: 16 }}>Loading company optimizer…</div>;
  if (report.error) return <div style={{ padding: 16 }}>Company optimizer error: {report.error.message}</div>;
  if (!report.data) return <div style={{ padding: 16 }}>No optimizer report.</div>;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={CARD}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <strong>Company Setup Optimizer</strong>
            <div style={{ marginTop: 6, color: "#475569" }}>
              Live SDK audit with browser-side host snapshot enrichment for plugins, secrets, skills, connectors, and agent-skill state.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => void refreshSnapshot()} disabled={snapshotBusy}>
              {snapshotBusy ? "Refreshing…" : "Refresh host snapshot"}
            </button>
            <button onClick={() => void handleBulkIssues()} disabled={bulkIssueBusy}>
              {bulkIssueBusy ? "Creating…" : "Create all high+ issues"}
            </button>
          </div>
        </div>
      </div>

      <ScoreCards report={report.data} />

      <div style={GRID_4}>
        <div style={CARD}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Agents</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{report.data.stats.agentCount}</div>
        </div>
        <div style={CARD}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Projects</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{report.data.stats.projectCount}</div>
        </div>
        <div style={CARD}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Goals</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{report.data.stats.goalCount}</div>
        </div>
        <div style={CARD}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Snapshot</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {report.data.snapshotFreshnessHours == null ? "Missing" : `${report.data.snapshotFreshnessHours.toFixed(1)}h old`}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
        <div style={CARD}>
          <strong>Axis summaries</strong>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {report.data.axisSummaries.map((axis) => (
              <div key={axis.axis} style={{ padding: 12, borderRadius: 12, background: "#f8fafc" }}>
                <div style={{ fontWeight: 700 }}>{AXIS_LABELS[axis.axis]}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                  score {axis.score} · {axis.totalChecks} checks
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                  {axis.warningCount} warning · {axis.failingCount} failing · {axis.criticalCount} critical
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD}>
          <strong>Snapshot coverage</strong>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <div>Plugins: {snapshotStatus.data?.pluginCount ?? 0}</div>
            <div>Company skills: {snapshotStatus.data?.skillCount ?? 0}</div>
            <div>Connector records: {snapshotStatus.data?.connectorCount ?? 0}</div>
            <div>Secrets: {snapshotStatus.data?.secretCount ?? 0}</div>
            <div>Agent skill snapshots: {snapshotStatus.data?.agentSkillCount ?? 0}</div>
          </div>
        </div>
      </div>

      <div style={CARD}>
        <strong>Issue-worthy setup gaps</strong>
        <div style={{ marginTop: 10, color: "#475569" }}>
          Native Paperclip issues are reserved for gaps that actually need operator action, credentials, or durable structural work.
        </div>
        <div style={{ marginTop: 12 }}>
          <IssueCandidateList candidates={report.data.issueCandidates} onOpenIssue={handleOpenIssue} />
        </div>
      </div>

      <div style={CARD}>
        <strong>All findings</strong>
        <div style={{ marginTop: 12 }}>
          <FindingsList report={report.data} onDismiss={handleDismiss} onOpenIssue={handleOpenIssue} />
        </div>
      </div>
    </div>
  );
}

export function OptimizerSettingsPage() {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={CARD}>
        <strong>Optimizer settings</strong>
        <div style={{ marginTop: 8, color: "#475569" }}>
          This plugin uses a mixed evaluation model:
        </div>
        <ul style={{ marginTop: 10, color: "#334155" }}>
          <li>live worker SDK reads for companies, agents, goals, projects, issues, and workspaces</li>
          <li>browser-side snapshots for plugins, secrets, company skills, connectors, and agent skill details</li>
          <li>native Paperclip issues only for issue-worthy findings</li>
        </ul>
      </div>
    </div>
  );
}
