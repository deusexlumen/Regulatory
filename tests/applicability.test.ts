/**
 * SPEC v2 §8 — Anwendbarkeitslogik, inkl. Ableitungstabelle §8.4 (F-03) und
 * Aktualitätsregel §6.6 (F-13).
 */
import { describe, expect, it } from "vitest";
import {
  assessApplicability,
  currentAssessment,
  deriveApplicabilityLabel,
} from "../src/engine/applicability.js";
import type { ApplicabilityAssessment, LegalAct } from "../src/domain/types.js";
import type { LegalActSlug } from "../src/domain/slugs.js";
import { brochureSiteProfile, demoShopProfile } from "../src/data/project-profiles.js";
import { fixedClock } from "../src/time/clock.js";
import { seedDataset } from "../src/data/seed.js";
import { ACT, PROFILE } from "../src/data/ids.js";

const clock = fixedClock("2026-09-16");

function act(slug: LegalActSlug, overrides: Partial<LegalAct> = {}): LegalAct {
  return {
    id: `act-${slug}`,
    slug,
    name: slug,
    jurisdiction: "EU",
    sourceRecords: ["src-1"],
    lifecycleState: "applicable",
    reviewStatus: "draft",
    ...overrides,
  };
}

describe("§8.3 Regel 1 — keine KI-Funktion, keine AI-Act-Pflicht", () => {
  it("markiert den AI Act für ein Profil ohne KI als nicht anwendbar", () => {
    const result = assessApplicability(act("EU_AI_ACT"), brochureSiteProfile, { clock });
    expect(result.applicable).toBe(false);
    expect(result.needsLegalReview).toBe(false);
    expect(deriveApplicabilityLabel(result)).toBe("not_applicable");
  });

  it("markiert ihn für ein Profil mit Chatbot als anwendbar", () => {
    const result = assessApplicability(act("EU_AI_ACT"), demoShopProfile, { clock });
    expect(result.applicable).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("verlangt Review, wenn nur automatisierte Entscheidungen vorliegen", () => {
    const profile = { ...brochureSiteProfile, hasAutomatedDecisions: true };
    const result = assessApplicability(act("EU_AI_ACT"), profile, { clock });
    expect(result.applicable).toBe(true);
    expect(result.confidence).toBe("medium");
    expect(result.needsLegalReview).toBe(true);
  });
});

describe("§8.3 Regel 2/3 — Prüfgegenstand (F-09)", () => {
  it("belegt BFSG ohne Dienstleistungsrelevanz als applicable/low/review", () => {
    const result = assessApplicability(act("BFSG"), brochureSiteProfile, { clock });
    expect(result.applicable).toBe(true);
    expect(result.confidence).toBe("low");
    expect(result.needsLegalReview).toBe(true);
    expect(result.reasons.join(" ")).toContain("Prüfgegenstand");
  });

  it("belegt den Data Act ohne Datenrelevanz mit derselben Feldbelegung", () => {
    const result = assessApplicability(act("EU_DATA_ACT"), brochureSiteProfile, { clock });
    expect(result.applicable).toBe(true);
    expect(result.confidence).toBe("low");
    expect(result.needsLegalReview).toBe(true);
  });
});

describe("§8.3 Regel 4/5 und §9.4.2 — fehlende Quelle senkt confidence", () => {
  it("setzt confidence low und needsLegalReview bei leerem sourceRecords", () => {
    const result = assessApplicability(act("BFSG", { sourceRecords: [] }), demoShopProfile, { clock });
    expect(result.confidence).toBe("low");
    expect(result.needsLegalReview).toBe(true);
  });

  it("setzt needsLegalReview, wenn der Rechtsakt in needs_legal_review steht", () => {
    const result = assessApplicability(
      act("BFSG", { lifecycleState: "needs_legal_review", preReviewState: "applicable" }),
      demoShopProfile,
      { clock },
    );
    expect(result.needsLegalReview).toBe(true);
  });

  it("deaktiviert die Anwendbarkeit bei superseded/repealed (§7.2.7)", () => {
    for (const state of ["superseded", "repealed"] as const) {
      const result = assessApplicability(act("BFSG", { lifecycleState: state }), demoShopProfile, { clock });
      expect(result.applicable).toBe(false);
    }
  });
});

describe("§8.4 Ableitungstabelle (F-03)", () => {
  const cases: Array<[Partial<ApplicabilityAssessment>, string]> = [
    [{ applicable: true, confidence: "high", needsLegalReview: true }, "needs_legal_review"],
    [{ applicable: false, confidence: "high", needsLegalReview: true }, "needs_legal_review"],
    [{ applicable: true, confidence: "high", needsLegalReview: false }, "applicable"],
    [{ applicable: true, confidence: "medium", needsLegalReview: false }, "applicable"],
    [{ applicable: true, confidence: "low", needsLegalReview: false }, "possibly_applicable"],
    [{ applicable: false, confidence: "low", needsLegalReview: false }, "not_applicable"],
  ];

  it.each(cases)("%o -> %s", (input, expected) => {
    expect(
      deriveApplicabilityLabel({
        applicable: input.applicable ?? false,
        confidence: input.confidence ?? "low",
        needsLegalReview: input.needsLegalReview ?? false,
      }),
    ).toBe(expected);
  });

  it("gibt needsLegalReview immer Vorrang", () => {
    expect(
      deriveApplicabilityLabel({ applicable: true, confidence: "high", needsLegalReview: true }),
    ).toBe("needs_legal_review");
  });
});

describe("§6.6 Aktualitätsregel (F-13)", () => {
  const base: ApplicabilityAssessment = {
    id: "asmt-old",
    legalActId: "act-1",
    projectProfileId: "profile-1",
    applicable: true,
    confidence: "high",
    reasons: [],
    needsLegalReview: false,
    assessedAt: "2026-01-01",
  };

  it("ignoriert abgelöste Einträge", () => {
    const newer: ApplicabilityAssessment = { ...base, id: "asmt-new", assessedAt: "2026-06-01" };
    const older: ApplicabilityAssessment = { ...base, supersededBy: "asmt-new" };
    expect(currentAssessment([older, newer], "act-1", "profile-1")?.id).toBe("asmt-new");
  });

  it("wählt bei mehreren offenen Einträgen den jüngsten", () => {
    const a: ApplicabilityAssessment = { ...base, id: "asmt-a", assessedAt: "2026-02-01" };
    const b: ApplicabilityAssessment = { ...base, id: "asmt-b", assessedAt: "2026-03-01" };
    expect(currentAssessment([a, b], "act-1", "profile-1")?.id).toBe("asmt-b");
  });

  it("liefert undefined, wenn alle Einträge abgelöst sind", () => {
    expect(currentAssessment([{ ...base, supersededBy: "x" }], "act-1", "profile-1")).toBeUndefined();
  });

  it("hält das abgelöste Seed-Assessment für den Audit-Trail vor", () => {
    const superseded = seedDataset.applicabilityAssessments.filter(
      (a) => a.supersededBy !== undefined,
    );
    expect(superseded.length).toBeGreaterThan(0);
    const current = currentAssessment(
      seedDataset.applicabilityAssessments,
      ACT.bfsg,
      PROFILE.demoShop,
    );
    expect(current).toBeDefined();
    expect(superseded.some((a) => a.supersededBy === current?.id)).toBe(true);
  });
});
