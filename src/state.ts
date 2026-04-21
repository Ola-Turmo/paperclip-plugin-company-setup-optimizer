import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { CompanyBrowserSnapshot, OptimizerCompanyState } from "./types.js";

const NAMESPACE = "company-setup-optimizer";
const BROWSER_SNAPSHOT_KEY = "browser-snapshot";
const COMPANY_STATE_KEY = "company-state";

export async function loadBrowserSnapshot(ctx: PluginContext, companyId: string): Promise<CompanyBrowserSnapshot | null> {
  const value = await ctx.state.get({
    scopeKind: "company",
    scopeId: companyId,
    namespace: NAMESPACE,
    stateKey: BROWSER_SNAPSHOT_KEY,
  });
  return value && typeof value === "object" ? (value as CompanyBrowserSnapshot) : null;
}

export async function saveBrowserSnapshot(ctx: PluginContext, companyId: string, snapshot: CompanyBrowserSnapshot) {
  await ctx.state.set(
    {
      scopeKind: "company",
      scopeId: companyId,
      namespace: NAMESPACE,
      stateKey: BROWSER_SNAPSHOT_KEY,
    },
    snapshot,
  );
}

export async function loadCompanyOptimizerState(ctx: PluginContext, companyId: string): Promise<OptimizerCompanyState> {
  const value = await ctx.state.get({
    scopeKind: "company",
    scopeId: companyId,
    namespace: NAMESPACE,
    stateKey: COMPANY_STATE_KEY,
  });

  if (!value || typeof value !== "object") {
    return {
      suppressedFindingIds: [],
      materializedIssues: {},
    };
  }

  const state = value as Partial<OptimizerCompanyState>;
  return {
    suppressedFindingIds: Array.isArray(state.suppressedFindingIds)
      ? state.suppressedFindingIds.filter((item): item is string => typeof item === "string")
      : [],
    materializedIssues:
      state.materializedIssues && typeof state.materializedIssues === "object"
        ? Object.fromEntries(
            Object.entries(state.materializedIssues).filter(
              (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string",
            ),
          )
        : {},
  };
}

export async function saveCompanyOptimizerState(ctx: PluginContext, companyId: string, state: OptimizerCompanyState) {
  await ctx.state.set(
    {
      scopeKind: "company",
      scopeId: companyId,
      namespace: NAMESPACE,
      stateKey: COMPANY_STATE_KEY,
    },
    state,
  );
}

