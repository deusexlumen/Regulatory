/**
 * SPEC v2 §7.1–§7.3 — Rechtsakt-Lifecycle, getrennt von der Control-Maschine
 * (§17.4: "beide Zustandsmaschinen existieren und sind getrennt getestet").
 */
import { describe, expect, it } from "vitest";
import {
  LegalActTransitionError,
  checkLegalActTransition,
  legalActStateRules,
  transitionLegalAct,
} from "../src/state/legal-act-lifecycle.js";
import { REGULATORY_LIFECYCLE_STATES } from "../src/domain/lifecycle-states.js";
import type { AuditEntry, LegalAct } from "../src/domain/types.js";
import { RegulatoryStore } from "../src/audit/store.js";
import { fixedClock } from "../src/time/clock.js";

function act(overrides: Partial<LegalAct> = {}): LegalAct {
  return {
    id: "act-x",
    slug: "BFSG",
    name: "Test",
    jurisdiction: "DE",
    sourceRecords: ["src-1"],
    lifecycleState: "observed",
    reviewStatus: "draft",
    ...overrides,
  };
}

const approval: AuditEntry = {
  id: "audit-1",
  timestamp: "2026-09-16T00:00:00.000Z",
  actor: "legal_reviewer",
  action: "approve",
  targetType: "legal_act",
  targetId: "act-x",
};

describe("§7.1.2 erlaubte Übergänge", () => {
  it("folgt der linearen Reifekette", () => {
    const chain: Array<[LegalAct["lifecycleState"], LegalAct["lifecycleState"]]> = [
      ["observed", "draft"],
      ["draft", "adopted"],
      ["adopted", "published"],
      ["published", "in_force"],
      ["in_force", "transition_period"],
      ["transition_period", "applicable"],
    ];
    for (const [from, to] of chain) {
      expect(checkLegalActTransition({ lifecycleState: from }, to).allowed).toBe(true);
    }
  });

  it("erlaubt any -> superseded/repealed/blocked/needs_legal_review", () => {
    for (const from of REGULATORY_LIFECYCLE_STATES) {
      if (from === "needs_legal_review") continue;
      for (const to of ["superseded", "repealed", "blocked", "needs_legal_review"] as const) {
        if (from === to) continue;
        expect(checkLegalActTransition({ lifecycleState: from }, to).allowed).toBe(true);
      }
    }
  });

  it("verbietet Sprünge in der Reifekette", () => {
    expect(checkLegalActTransition({ lifecycleState: "draft" }, "applicable").allowed).toBe(false);
    expect(checkLegalActTransition({ lifecycleState: "observed" }, "published").allowed).toBe(false);
  });

  it("kennt weder implemented noch needs_review (F-01)", () => {
    expect(REGULATORY_LIFECYCLE_STATES as readonly string[]).not.toContain("implemented");
    expect(REGULATORY_LIFECYCLE_STATES as readonly string[]).not.toContain("needs_review");
  });
});

describe("§7.3 Review-Rückkehr statt Sprung-Übergang (F-06)", () => {
  it("speichert den bisherigen Zustand beim Eintritt", () => {
    const updated = transitionLegalAct(act({ lifecycleState: "in_force" }), "needs_legal_review");
    expect(updated.lifecycleState).toBe("needs_legal_review");
    expect(updated.preReviewState).toBe("in_force");
  });

  it("erlaubt nur die Rückkehr exakt in preReviewState", () => {
    const inReview = transitionLegalAct(act({ lifecycleState: "in_force" }), "needs_legal_review");
    expect(checkLegalActTransition(inReview, "applicable").allowed).toBe(false);
    expect(checkLegalActTransition(inReview, "published").allowed).toBe(false);
    expect(checkLegalActTransition(inReview, "in_force").allowed).toBe(true);
  });

  it("verlangt eine dokumentierte Freigabe durch legal_reviewer", () => {
    const inReview = transitionLegalAct(act({ lifecycleState: "in_force" }), "needs_legal_review");
    expect(() => transitionLegalAct(inReview, "in_force")).toThrow(LegalActTransitionError);
    expect(() =>
      transitionLegalAct(inReview, "in_force", {
        approval: { ...approval, actor: "developer" },
      }),
    ).toThrow(LegalActTransitionError);
    expect(() =>
      transitionLegalAct(inReview, "in_force", {
        approval: { ...approval, action: "review" },
      }),
    ).toThrow(LegalActTransitionError);
  });

  it("leert preReviewState nach der Rückkehr", () => {
    const inReview = transitionLegalAct(act({ lifecycleState: "in_force" }), "needs_legal_review");
    const returned = transitionLegalAct(inReview, "in_force", { approval });
    expect(returned.lifecycleState).toBe("in_force");
    expect(returned.preReviewState).toBeUndefined();
  });

  it("blockiert den Ausgang, wenn preReviewState fehlt", () => {
    const orphan = act({ lifecycleState: "needs_legal_review" });
    expect(checkLegalActTransition(orphan, "applicable").allowed).toBe(false);
  });
});

describe("§7.2 Zustandsregeln", () => {
  it("bildet die sieben Regeln als Prädikate ab", () => {
    expect(legalActStateRules.blocksFinalContent("needs_legal_review")).toBe(true);
    expect(legalActStateRules.architecturePreparationOnly("draft")).toBe(true);
    expect(legalActStateRules.opensContentUpdateWindow("published")).toBe(true);
    expect(legalActStateRules.opensContentUpdateWindow("adopted")).toBe(false);
    expect(legalActStateRules.createsImplementationPriority("transition_period")).toBe(true);
    expect(legalActStateRules.requiresEvidence("applicable")).toBe(true);
    expect(legalActStateRules.blocksImplementation("blocked")).toBe(true);
    expect(legalActStateRules.deactivatesObligations("superseded")).toBe(true);
    expect(legalActStateRules.deactivatesObligations("repealed")).toBe(true);
  });
});

describe("Store-Integration: Freigabe ist im Audit-Trail nachweisbar (§7.3.2, §13.2)", () => {
  it("protokolliert approve vor der Rückkehr", () => {
    const store = new RegulatoryStore({
      clock: fixedClock("2026-09-16"),
    });
    store.addSourceRecord({
      id: "src-1",
      sourceSystem: "Manual",
      documentType: "guidance",
      retrievedAt: "2026-09-16",
      confidence: "high",
    });
    store.addLegalAct(act({ lifecycleState: "in_force" }));
    store.transitionLegalAct("act-x", "needs_legal_review");
    store.transitionLegalAct("act-x", "in_force");

    const trail = store.snapshot().auditEntries.filter((e) => e.targetId === "act-x");
    expect(trail.some((e) => e.action === "approve" && e.actor === "legal_reviewer")).toBe(true);
    expect(store.snapshot().legalActs[0]?.lifecycleState).toBe("in_force");
    expect(store.snapshot().legalActs[0]?.preReviewState).toBeUndefined();
  });

  it("weist eine Rückkehr durch einen anderen Akteur zurück", () => {
    const store = new RegulatoryStore({ clock: fixedClock("2026-09-16") });
    store.addLegalAct(act({ lifecycleState: "in_force", sourceRecords: [] }));
    store.transitionLegalAct("act-x", "needs_legal_review");
    expect(() => store.transitionLegalAct("act-x", "in_force", { actor: "developer" })).toThrow();
  });
});
