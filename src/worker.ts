import { definePlugin, runWorker, type PluginContext, type ToolResult } from "@paperclipai/plugin-sdk";
import { AXIS_LABELS, buildScaffoldReport, summarizeBlockers, CHECK_CATALOG } from "./catalog.js";

function requireOptionalCompanyId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function registerData(ctx: PluginContext) {
  ctx.data.register("optimizerCatalog", async () => ({
    mode: "scaffold",
    axisLabels: AXIS_LABELS,
    totalChecks: CHECK_CATALOG.length,
    checksByAxis: Object.fromEntries(
      Object.keys(AXIS_LABELS).map((axis) => [
        axis,
        CHECK_CATALOG.filter((check) => check.axis === axis).length,
      ]),
    ),
  }));

  ctx.data.register("companyOptimizationReport", async (params) => {
    const companyId = requireOptionalCompanyId((params as Record<string, unknown>).companyId);
    return buildScaffoldReport(companyId);
  });

  ctx.data.register("companyOptimizationBlockers", async (params) => {
    const companyId = requireOptionalCompanyId((params as Record<string, unknown>).companyId);
    const report = buildScaffoldReport(companyId);
    return {
      companyId,
      blockers: summarizeBlockers(report),
    };
  });
}

async function registerActions(ctx: PluginContext) {
  ctx.actions.register("runCompanyAnalysis", async (params) => {
    const companyId = requireOptionalCompanyId((params as Record<string, unknown>).companyId);
    const report = buildScaffoldReport(companyId);
    ctx.logger.info("Generated scaffold company setup optimization report", {
      companyId,
      totalChecks: report.findings.length,
      issueCandidates: report.issueCandidates.length,
    });
    return report;
  });

  ctx.actions.register("generateIssueCandidates", async (params) => {
    const companyId = requireOptionalCompanyId((params as Record<string, unknown>).companyId);
    const report = buildScaffoldReport(companyId);
    return {
      companyId,
      issueCandidates: report.issueCandidates,
    };
  });
}

async function registerTools(ctx: PluginContext) {
  ctx.tools.register(
    "analyze_company_setup",
    {
      displayName: "Analyze company setup",
      description: "Return a scaffold optimization report for the active company.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string };
      const companyId = payload.companyId ?? runCtx.companyId ?? null;
      const report = buildScaffoldReport(companyId);
      return {
        content: `Optimizer scaffold report generated. Overall score ${report.scorecard.overall}/100 with ${report.issueCandidates.length} issue-worthy setup gaps.`,
        data: report,
      };
    },
  );

  ctx.tools.register(
    "summarize_company_blockers",
    {
      displayName: "Summarize company blockers",
      description: "Return the activation blockers from the optimizer report.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string };
      const companyId = payload.companyId ?? runCtx.companyId ?? null;
      const blockers = summarizeBlockers(buildScaffoldReport(companyId));
      return {
        content: blockers.length
          ? blockers.map((blocker) => `- ${blocker.title}`).join("\n")
          : "No activation blockers surfaced in scaffold mode.",
        data: blockers,
      };
    },
  );

  ctx.tools.register(
    "suggest_company_activation_sequence",
    {
      displayName: "Suggest company activation sequence",
      description: "Return a simple activation sequence suggestion from the current scaffold report.",
      parametersSchema: {
        type: "object",
        properties: {
          companyId: { type: "string" }
        }
      }
    },
    async (params, runCtx): Promise<ToolResult> => {
      const payload = params as { companyId?: string };
      const companyId = payload.companyId ?? runCtx.companyId ?? null;
      const blockers = summarizeBlockers(buildScaffoldReport(companyId));
      return {
        content: blockers.length
          ? `Fix activation blockers first, starting with: ${blockers[0]?.title}`
          : "No scaffold blockers found. Next move is to wire the live Paperclip objects and re-run the optimizer.",
        data: {
          companyId,
          recommendedSequence: blockers.slice(0, 5),
        },
      };
    },
  );
}

const plugin = definePlugin({
  async setup(ctx) {
    await registerData(ctx);
    await registerActions(ctx);
    await registerTools(ctx);
  },

  async onHealth() {
    return {
      status: "ok",
      message: "Company Setup Optimizer scaffold worker is ready.",
      version: "0.1.0",
    };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
