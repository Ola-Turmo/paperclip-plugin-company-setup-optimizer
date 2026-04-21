import * as React from "react";
import type { CSSProperties } from "react";
import {
  useHostContext,
  usePluginData,
  type PluginPageProps,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import type { CompanyOptimizationReport } from "../types.js";
import { AXIS_LABELS } from "../catalog.js";

const CARD: CSSProperties = {
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.94)",
};

const SCORE: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  lineHeight: 1,
};

function scopeParams(companyId?: string | null) {
  return companyId ? { companyId } : {};
}

function ReportSummary(props: { report: CompanyOptimizationReport }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
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

      <div style={CARD}>
        <strong>Issue-worthy gaps</strong>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {props.report.issueCandidates.slice(0, 8).map((candidate) => (
            <div key={candidate.key} style={{ padding: 12, borderRadius: 12, background: "#f8fafc" }}>
              <div style={{ fontWeight: 600 }}>{candidate.title}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>{candidate.whyItMatters}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#0f766e" }}>
                {candidate.blocksActivation ? "Blocks activation" : "Optimization issue"} · {candidate.severity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardWidget(_props: PluginWidgetProps) {
  const context = useHostContext();
  const report = usePluginData<CompanyOptimizationReport>(
    "companyOptimizationReport",
    scopeParams(context.companyId),
  );

  if (report.loading) return <div>Loading optimizer…</div>;
  if (report.error) return <div>Optimizer error: {report.error.message}</div>;
  if (!report.data) return <div>No optimizer report.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong>Setup Optimizer</strong>
      <div>Mode: scaffold</div>
      <div>Overall: {report.data.scorecard.overall}/100</div>
      <div>Issue-worthy gaps: {report.data.issueCandidates.length}</div>
      <div>Critical blockers: {report.data.issueCandidates.filter((item) => item.blocksActivation).length}</div>
    </div>
  );
}

export function CompanySetupOptimizerPage(_props: PluginPageProps) {
  const context = useHostContext();
  const report = usePluginData<CompanyOptimizationReport>(
    "companyOptimizationReport",
    scopeParams(context.companyId),
  );

  if (report.loading) return <div style={{ padding: 16 }}>Loading optimizer…</div>;
  if (report.error) return <div style={{ padding: 16 }}>Optimizer error: {report.error.message}</div>;
  if (!report.data) return <div style={{ padding: 16 }}>No optimizer report.</div>;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={CARD}>
        <strong>Company Setup Optimizer</strong>
        <div style={{ marginTop: 8, color: "#475569" }}>
          Scaffold mode is active. The rule engine, scorecard, issue candidate model, and UI surfaces are ready. The
          next implementation phase is wiring each check to live Paperclip objects.
        </div>
      </div>

      <ReportSummary report={report.data} />

      <div style={CARD}>
        <strong>Axes</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginTop: 12 }}>
          {report.data.axisSummaries.map((axis) => (
            <div key={axis.axis} style={{ padding: 12, borderRadius: 12, background: "#f8fafc" }}>
              <div style={{ fontWeight: 600 }}>{AXIS_LABELS[axis.axis]}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                {axis.totalChecks} checks · score {axis.score}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                {axis.warningCount} warnings · {axis.failingCount} failing · {axis.criticalCount} critical
              </div>
            </div>
          ))}
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
          V1 scaffold settings are intentionally static. The implementation path after this scaffold is:
        </div>
        <ol style={{ marginTop: 10, color: "#334155" }}>
          <li>wire live Paperclip entities into the rule engine</li>
          <li>deduplicate findings over time</li>
          <li>open native issues only for human-needed gaps</li>
          <li>add safe auto-fixes for low-risk drift</li>
        </ol>
      </div>
    </div>
  );
}

