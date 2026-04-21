import { definePlugin, runWorker, type PluginContext, type ToolResult } from "@paperclipai/plugin-sdk";
import { analyzeCompany, analyzePortfolio, buildIssueDescription } from "./optimizer.js";
import { AXIS_LABELS, CHECK_DEFINITIONS } from "./catalog.js";
import { loadBrowserSnapshot, loadCompanyOptimizerState, saveBrowserSnapshot, saveCompanyOptimizerState } from "./state.js";
import type { CompanyBrowserSnapshot, SetupIssueCandidate } from "./types.js";

function requireCompanyId(input: Record<string, unknown>) {
  const companyId = typeof input.companyId === "string" ? input.companyId.trim() : "";
  if (!companyId) throw new Error("companyId is required");
  return companyId;
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseSnapshot(value: unknown, companyId: string): CompanyBrowserSnapshot {
  if (!value || typeof value !== "object") throw new Error("snapshot is required");
  const snapshot = value as CompanyBrowserSnapshot;
  if (snapshot.companyId !== companyId) throw new Error("snapshot companyId mismatch");
  if (!snapshot.capturedAt) throw new Error("snapshot capturedAt is required");
  return snapshot;
}

function severityRank(severity: SetupIssueCandidate["severity"]) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function shouldMaterialize(candidate: SetupIssueCandidate, threshold: SetupIssueCandidate["severity"]) {
  return severityRank(candidate.severity) >= severityRank(threshold);
}

async function upsertOptimizerIssue(ctx: PluginContext, companyId: string, candidate: SetupIssueCandidate) {
  const report = await analyzeCompany(ctx, companyId);
  const existing = report.issueCandidates.find((item) => item.key === candidate.key)?.existingIssueId;
  const company = await ctx.companies.get(companyId);
  if (!company) throw new Error("Company not found");

  const firstProject = (await ctx.projects.list({ companyId, limit: 1, offset: 0 }))[0];
  const firstCompanyGoal = (await ctx.goals.list({ companyId, level: "company", limit: 1, offset: 0 }))[0];
  const description = buildIssueDescription(report, candidate);

  if (existing) {
    const issue = await ctx.issues.update(
      existing,
      {
        title: candidate.title,
        description,
        priority: candidate.severity === "critical" ? "critical" : candidate.severity === "high" ? "high" : "medium",
      },
      companyId,
    );
    return issue;
  }

  return await ctx.issues.create({
    companyId,
    projectId: firstProject?.id,
    goalId: firstCompanyGoal?.id,
    title: candidate.title,
    description,
    priority: candidate.severity === "critical" ? "critical" : candidate.severity === "high" ? "high" : "medium",
  });
}

async function registerData(ctx: PluginContext) {
  ctx.data.register("optimizerCatalog", async () => ({
    axisLabels: AXIS_LABELS,
    checks: Object.values(CHECK_DEFINITIONS),
  }));

  ctx.data.register("portfolioOptimizationSummary", async () => {
    return await analyzePortfolio(ctx);
  });

  ctx.data.register("companyBrowserSnapshotStatus", async (params) => {
    const companyId = requireCompanyId(params as Record<string, unknown>);
    const snapshot = await loadBrowserSnapshot(ctx, companyId);
    return {
      companyId,
      present: Boolean(snapshot),
      capturedAt: snapshot?.capturedAt ?? null,
      pluginCount: snapshot?.plugins.length ?? 0,
      skillCount: snapshot?.companySkills.length ?? 0,
      connectorCount: snapshot?.connectors.connections.length ?? 0,
      secretCount: snapshot?.secrets.length ?? 0,
      agentSkillCount: snapshot?.agentSkills.length ?? 0,
    };
  });

  ctx.data.register("companyOptimizationReport", async (params) => {
    const companyId = requireCompanyId(params as Record<string, unknown>);
    return await analyzeCompany(ctx, companyId);
  });

  ctx.data.register("companyOptimizationBlockers", async (params) => {
    const companyId = requireCompanyId(params as Record<string, unknown>);
    const report = await analyzeCompany(ctx, companyId);
    return {
      companyId,
      blockers: report.issueCandidates.filter((candidate) => candidate.blocksActivation),
    };
  });
}

async function registerActions(ctx: PluginContext) {
  ctx.actions.register("saveBrowserSnapshot", async (params) => {
    const payload = params as Record<string, unknown>;
    const companyId = requireCompanyId(payload);
    const snapshot = parseSnapshot(payload.snapshot, companyId);
    await saveBrowserSnapshot(ctx, companyId, snapshot);
    await ctx.activity.log({
      companyId,
      message: "Optimizer browser snapshot refreshed",
      metadata: {
        capturedAt: snapshot.capturedAt,
        pluginCount: snapshot.plugins.length,
        skillCount: snapshot.companySkills.length,
        secretCount: snapshot.secrets.length,
        connectorCount: snapshot.connectors.connections.length,
      },
    });
    return {
      ok: true,
      companyId,
      capturedAt: snapshot.capturedAt,
    };
  });

  ctx.actions.register("dismissFinding", async (params) => {
    const payload = params as Record<string, unknown>;
    const companyId = requireCompanyId(payload);
    const findingId = normalizeString(payload.findingId);
    if (!findingId) throw new Error("findingId is required");
    const state = await loadCompanyOptimizerState(ctx, companyId);
    state.suppressedFindingIds = [...new Set([...state.suppressedFindingIds, findingId])];
    await saveCompanyOptimizerState(ctx, companyId, state);
    return state;
  });

  ctx.actions.register("undismissFinding", async (params) => {
    const payload = params as Record<string, unknown>;
    const companyId = requireCompanyId(payload);
    const findingId = normalizeString(payload.findingId);
    if (!findingId) throw new Error("findingId is required");
    const state = await loadCompanyOptimizerState(ctx, companyId);
    state.suppressedFindingIds = state.suppressedFindingIds.filter((item) => item !== findingId);
    await saveCompanyOptimizerState(ctx, companyId, state);
    return state;
  });

  ctx.actions.register("runCompanyAnalysis", async (params) => {
    const companyId = requireCompanyId(params as Record<string, unknown>);
    return await analyzeCompany(ctx, companyId);
  });

  ctx.actions.register("materializeIssueCandidate", async (params) => {
    const payload = params as Record<string, unknown>;
    const companyId = requireCompanyId(payload);
    const key = normalizeString(payload.key);
    if (!key) throw new Error("key is required");
    const report = await analyzeCompany(ctx, companyId);
    const candidate = report.issueCandidates.find((item) => item.key === key);
    if (!candidate) throw new Error(`Issue candidate '${key}' not found`);
    const issue = await upsertOptimizerIssue(ctx, companyId, candidate);
    const state = await loadCompanyOptimizerState(ctx, companyId);
    state.materializedIssues[candidate.key] = issue.id;
    await saveCompanyOptimizerState(ctx, companyId, state);
    return {
      companyId,
      issue,
      candidate,
    };
  });

  ctx.actions.register("materializeIssueCandidates", async (params) => {
    const payload = params as Record<string, unknown>;
    const companyId = requireCompanyId(payload);
    const threshold = (normalizeString(payload.threshold) as SetupIssueCandidate["severity"] | undefined) ?? "high";
    const report = await analyzeCompany(ctx, companyId);
    const candidates = report.issueCandidates.filter((candidate) => shouldMaterialize(candidate, threshold));
    const created = [];
    const state = await loadCompanyOptimizerState(ctx, companyId);
    for (const candidate of candidates) {
      const issue = await upsertOptimizerIssue(ctx, companyId, candidate);
      state.materializedIssues[candidate.key] = issue.id;
      created.push({ key: candidate.key, issueId: issue.id, identifier: issue.identifier });
    }
    await saveCompanyOptimizerState(ctx, companyId, state);
    return {
      companyId,
      created,
      total: created.length,
    };
  });
}

async function registerJobs(ctx: PluginContext) {
  ctx.jobs.register("daily-optimizer-audit", async (_job) => {
    const portfolio = await analyzePortfolio(ctx);
    ctx.logger.info("Completed daily optimizer audit", {
      companies: portfolio.companies.length,
      worstCompany: portfolio.companies.sort((left, right) => left.overallScore - right.overallScore)[0]?.companyName ?? null,
    });
  });
}

async function registerTools(ctx: PluginContext) {
  ctx.tools.register(
    "analyze_company_setup",
    {
      displayName: "Analyze company setup",
      description: "Return a live setup optimization report for the active company.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string };
      const companyId = payload.companyId ?? runCtx.companyId;
      if (!companyId) return { error: "companyId is required" };
      const report = await analyzeCompany(ctx, companyId);
      return {
        content: `Overall ${report.scorecard.overall}/100. ${report.issueCandidates.length} issue-worthy gaps, ${report.issueCandidates.filter((item) => item.blocksActivation).length} activation blockers.`,
        data: report,
      };
    },
  );

  ctx.tools.register(
    "summarize_company_blockers",
    {
      displayName: "Summarize company blockers",
      description: "Return the current activation blockers and critical setup gaps for the active company.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string };
      const companyId = payload.companyId ?? runCtx.companyId;
      if (!companyId) return { error: "companyId is required" };
      const report = await analyzeCompany(ctx, companyId);
      const blockers = report.issueCandidates.filter((item) => item.blocksActivation);
      return {
        content: blockers.length
          ? blockers.map((item) => `- ${item.title}`).join("\n")
          : "No activation blockers found.",
        data: blockers,
      };
    },
  );

  ctx.tools.register(
    "suggest_company_activation_sequence",
    {
      displayName: "Suggest company activation sequence",
      description: "Recommend the next best activation sequence based on the current setup gaps.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string };
      const companyId = payload.companyId ?? runCtx.companyId;
      if (!companyId) return { error: "companyId is required" };
      const report = await analyzeCompany(ctx, companyId);
      const blockers = report.issueCandidates.filter((item) => item.blocksActivation);
      return {
        content: blockers.length
          ? [
              "1. Fix the first activation blocker.",
              `2. Then address: ${blockers.slice(1, 3).map((item) => item.title).join("; ") || "remaining blocker set"}.`,
              "3. Re-run the optimizer and only then unpause company activity.",
            ].join("\n")
          : "No hard blockers found. Start by activating the smallest safe workflow for the company and re-run the optimizer after the first real execution.",
        data: {
          companyId,
          blockers,
        },
      };
    },
  );

  ctx.tools.register(
    "open_setup_gap_issue",
    {
      displayName: "Open setup gap issue",
      description: "Create or refresh a native Paperclip issue from an optimizer finding.",
      parametersSchema: {
        type: "object",
        required: ["key"],
        properties: {
          companyId: { type: "string" },
          key: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string; key?: string };
      const companyId = payload.companyId ?? runCtx.companyId;
      if (!companyId || !payload.key) return { error: "companyId and key are required" };
      const report = await analyzeCompany(ctx, companyId);
      const candidate = report.issueCandidates.find((item) => item.key === payload.key);
      if (!candidate) return { error: `Issue candidate '${payload.key}' not found.` };
      const issue = await upsertOptimizerIssue(ctx, companyId, candidate);
      const state = await loadCompanyOptimizerState(ctx, companyId);
      state.materializedIssues[candidate.key] = issue.id;
      await saveCompanyOptimizerState(ctx, companyId, state);
      return {
        content: `Opened or refreshed ${issue.identifier ?? issue.id} for ${candidate.title}.`,
        data: issue,
      };
    },
  );
}

const plugin = definePlugin({
  async setup(ctx) {
    await registerData(ctx);
    await registerActions(ctx);
    await registerJobs(ctx);
    await registerTools(ctx);
  },

  async onHealth() {
    return {
      status: "ok",
      message: "Company Setup Optimizer is running with live SDK audits and browser-snapshot enrichment.",
      version: "0.1.0",
    };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
