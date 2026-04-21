import { describe, expect, it } from "vitest";
import { AXIS_LABELS, CHECK_CATALOG, buildScaffoldReport } from "../src/catalog.js";

describe("optimizer catalog", () => {
  it("has unique check ids", () => {
    const ids = CHECK_CATALOG.map((check) => check.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every declared axis", () => {
    for (const axis of Object.keys(AXIS_LABELS)) {
      expect(CHECK_CATALOG.some((check) => check.axis === axis)).toBe(true);
    }
  });

  it("builds a scaffold report with issue candidates", () => {
    const report = buildScaffoldReport("company-123");
    expect(report.mode).toBe("scaffold");
    expect(report.findings.length).toBe(CHECK_CATALOG.length);
    expect(report.issueCandidates.length).toBeGreaterThan(0);
  });
});

