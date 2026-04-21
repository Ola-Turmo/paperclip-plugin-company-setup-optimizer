import { describe, expect, it } from "vitest";
import { AXIS_LABELS, CHECK_DEFINITIONS } from "../src/catalog.js";

describe("optimizer catalog", () => {
  it("has unique check ids", () => {
    const ids = Object.keys(CHECK_DEFINITIONS);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every declared axis", () => {
    for (const axis of Object.keys(AXIS_LABELS)) {
      expect(Object.values(CHECK_DEFINITIONS).some((check) => check.axis === axis)).toBe(true);
    }
  });

  it("includes activation and connector checks", () => {
    expect(CHECK_DEFINITIONS["activation.company_can_move_forward"]).toBeDefined();
    expect(CHECK_DEFINITIONS["connectors.provider_fit"]).toBeDefined();
  });
});

