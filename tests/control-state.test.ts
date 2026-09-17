/**
 * SPEC v2 §7.4 — Control-Implementierungsstatus, getrennt getestet.
 */
import { describe, expect, it } from "vitest";
import {
  CONTROL_PROGRESS_RANK,
  ControlTransitionError,
  checkControlTransition,
  isArchitectureUnprepared,
  leastAdvancedState,
  toChecklistState,
  transitionControl,
} from "../src/state/control-implementation.js";
import { CONTROL_IMPLEMENTATION_STATES } from "../src/domain/lifecycle-states.js";
import type { ComplianceControl } from "../src/domain/types.js";

function control(state: ComplianceControl["implementationState"], id = "ctl-1"): ComplianceControl {
  return {
    id,
    obligationId: "obl-1",
    title: "Test",
    controlType: "ui_component",
    implementationState: state,
    dependsOnPublication: false,
    dependsOnLegalText: false,
  };
}

describe("§7.4 Übergänge", () => {
  it("erlaubt genau die spezifizierten Übergänge", () => {
    const allowed: Array<[ComplianceControl["implementationState"], ComplianceControl["implementationState"]]> = [
      ["not_started", "prepared"],
      ["prepared", "in_progress"],
      ["in_progress", "needs_review"],
      ["needs_review", "implemented"],
      ["needs_review", "in_progress"],
      ["implemented", "needs_review"],
      ["blocked", "in_progress"],
    ];
    for (const [from, to] of allowed) {
      expect(checkControlTransition(from, to).allowed).toBe(true);
    }
  });

  it("erlaubt any -> blocked", () => {
    for (const from of CONTROL_IMPLEMENTATION_STATES) {
      if (from === "blocked") continue;
      expect(checkControlTransition(from, "blocked").allowed).toBe(true);
    }
  });

  it("verbietet Sprünge", () => {
    expect(checkControlTransition("not_started", "implemented").allowed).toBe(false);
    expect(checkControlTransition("prepared", "implemented").allowed).toBe(false);
    expect(checkControlTransition("implemented", "in_progress").allowed).toBe(false);
    expect(() => transitionControl(control("not_started"), "implemented")).toThrow(ControlTransitionError);
  });

  it("kennt keine Rechtsakt-Zustände (F-01)", () => {
    for (const forbidden of ["published", "applicable", "in_force", "needs_legal_review"]) {
      expect(CONTROL_IMPLEMENTATION_STATES as readonly string[]).not.toContain(forbidden);
    }
  });
});

describe("§9.6 ungünstigster Zustand gewinnt", () => {
  it("rankt blocked als ungünstigsten Zustand", () => {
    expect(CONTROL_PROGRESS_RANK.blocked).toBeLessThan(CONTROL_PROGRESS_RANK.not_started);
    expect(CONTROL_PROGRESS_RANK.implemented).toBeGreaterThan(CONTROL_PROGRESS_RANK.needs_review);
  });

  it("wählt aus einer Menge den am wenigsten fortgeschrittenen Zustand", () => {
    expect(leastAdvancedState([control("implemented", "a"), control("blocked", "b")])).toBe("blocked");
    expect(leastAdvancedState([control("implemented", "a"), control("prepared", "b")])).toBe("prepared");
    expect(leastAdvancedState([])).toBeUndefined();
  });

  it("wertet not_started und blocked als 'Architektur nicht vorbereitet'", () => {
    expect(isArchitectureUnprepared("not_started")).toBe(true);
    expect(isArchitectureUnprepared("blocked")).toBe(true);
    expect(isArchitectureUnprepared("prepared")).toBe(false);
    expect(isArchitectureUnprepared(undefined)).toBe(true);
  });
});

describe("§10.2 Mapping auf ChecklistItem.state", () => {
  it("bildet implemented auf done ab und lässt den Rest unverändert", () => {
    expect(toChecklistState("implemented")).toBe("done");
    expect(toChecklistState("blocked")).toBe("blocked");
    expect(toChecklistState("needs_review")).toBe("needs_review");
  });
});
