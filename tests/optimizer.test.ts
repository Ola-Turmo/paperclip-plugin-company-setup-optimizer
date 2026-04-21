import { describe, expect, it } from "vitest";
import {
  connectorCoverageEvidence,
  connectorProviderSet,
  shouldIncludeIssueCandidate,
} from "../src/optimizer.js";
import type { CompanyBrowserSnapshot, OptimizationFinding } from "../src/types.js";

function makeSnapshot(statuses: Array<{ providerId: string; status: string }>): CompanyBrowserSnapshot {
  return {
    companyId: "company-1",
    capturedAt: "2026-04-21T09:00:00.000Z",
    plugins: [],
    companySkills: [],
    secrets: [],
    connectors: {
      summary: {
        totalConnections: statuses.length,
        statusCounts: {},
        usageCounts: {},
        providerCounts: {},
        warnings: [],
      },
      connections: statuses.map((item, index) => ({
        id: `conn-${index}`,
        providerId: item.providerId,
        label: `${item.providerId}-${item.status}`,
        accountIdentifier: `${item.providerId}-${index}`,
        usage: "other",
        status: item.status,
        secretRefs: {},
      })),
    },
    agentSkills: [],
  };
}

function makeFinding(
  partial: Partial<OptimizationFinding> & Pick<OptimizationFinding, "id" | "status">,
): OptimizationFinding {
  return {
    id: partial.id,
    axis: partial.axis ?? "connectors_accounts",
    title: partial.title ?? partial.id,
    description: partial.description ?? "desc",
    severity: partial.severity ?? "high",
    issueWhenHumanActionNeeded: partial.issueWhenHumanActionNeeded ?? true,
    blocksActivation: partial.blocksActivation ?? false,
    suggestedFix: partial.suggestedFix ?? "fix",
    status: partial.status,
    evidence: partial.evidence ?? "evidence",
    source: partial.source ?? "browser_snapshot",
    suppressed: partial.suppressed ?? false,
  };
}

describe("optimizer connector coverage helpers", () => {
  it("counts only allowed connector statuses", () => {
    const snapshot = makeSnapshot([
      { providerId: "github", status: "connected" },
      { providerId: "posthog", status: "draft" },
      { providerId: "cloudflare", status: "paused" },
    ]);

    expect([...connectorProviderSet(snapshot)]).toEqual(["github"]);
    expect([...connectorProviderSet(snapshot, ["connected", "draft"])]).toEqual(["github", "posthog"]);
  });

  it("reports provider-count evidence for allowed statuses only", () => {
    const snapshot = makeSnapshot([
      { providerId: "gmail", status: "draft" },
      { providerId: "gmail", status: "connected" },
      { providerId: "posthog", status: "draft" },
      { providerId: "cloudflare", status: "paused" },
    ]);

    const connectedOnly = connectorCoverageEvidence(snapshot, ["gmail", "posthog"], ["connected"]);
    expect(connectedOnly.providerCount).toBe(1);
    expect(connectedOnly.statuses).toEqual(["gmail:connected"]);

    const plannedCoverage = connectorCoverageEvidence(snapshot, ["gmail", "posthog"], ["connected", "draft"]);
    expect(plannedCoverage.providerCount).toBe(2);
    expect(plannedCoverage.statuses).toEqual(["gmail:draft", "gmail:connected", "posthog:draft"]);
  });
});

describe("optimizer issue-candidate gating", () => {
  it("suppresses future-activation warnings for dormant companies", () => {
    const finding = makeFinding({
      id: "connectors.provider_fit",
      status: "warning",
      issueWhenHumanActionNeeded: true,
    });
    expect(shouldIncludeIssueCandidate(finding, true)).toBe(false);
    expect(shouldIncludeIssueCandidate(finding, false)).toBe(true);
  });

  it("still keeps non-advisory warnings and failing findings issue-worthy", () => {
    const activationWarning = makeFinding({
      id: "activation.company_can_move_forward",
      status: "warning",
      issueWhenHumanActionNeeded: true,
    });
    const failingConnector = makeFinding({
      id: "connectors.provider_fit",
      status: "failing",
      issueWhenHumanActionNeeded: true,
    });

    expect(shouldIncludeIssueCandidate(activationWarning, true)).toBe(true);
    expect(shouldIncludeIssueCandidate(failingConnector, true)).toBe(true);
  });

  it("never opens issue candidates for pass, suppressed, or non-human findings", () => {
    expect(shouldIncludeIssueCandidate(makeFinding({ id: "x.pass", status: "pass" }), false)).toBe(false);
    expect(
      shouldIncludeIssueCandidate(
        makeFinding({ id: "x.suppressed", status: "warning", suppressed: true }),
        false,
      ),
    ).toBe(false);
    expect(
      shouldIncludeIssueCandidate(
        makeFinding({ id: "x.auto", status: "warning", issueWhenHumanActionNeeded: false }),
        false,
      ),
    ).toBe(false);
  });
});
