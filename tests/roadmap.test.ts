/**
 * SPEC v2 §13.3 — Roadmap-Engine-Tests, ergänzt um die Regeln aus §9.3, §9.5
 * und §9.6.
 */
import { describe, expect, it } from "vitest";
import { buildRoadmap, buildRoadmapResult, deriveDeadlineHint } from "../src/engine/roadmap.js";
import { fixedClock } from "../src/time/clock.js";
import { makeDataset, TEST_TODAY, inDays } from "./helpers/fixtures.js";
import { seedDataset } from "../src/data/seed.js";
import { projectProfiles } from "../src/data/project-profiles.js";
import type { LegalAct } from "../src/domain/types.js";

const clock = fixedClock(TEST_TODAY);
const PROFILE_ID = "profile-demo-shop";

function items(dataset: Parameters<typeof buildRoadmap>[0]) {
  return buildRoadmap(dataset, PROFILE_ID, { clock });
}

describe("§13.3 — Status published erzeugt Content-Update-Fenster", () => {
  it("fordert ein Rechtstext-Update ab published", () => {
    for (const state of ["published", "in_force", "transition_period", "applicable"] as const) {
      const result = items(makeDataset({ lifecycleState: state, requiresLegalText: true }));
      expect(result[0]?.legalTextUpdateRequired, state).toBe(true);
    }
  });

  it("fordert vor published kein Rechtstext-Update", () => {
    for (const state of ["observed", "draft", "adopted"] as const) {
      const result = items(makeDataset({ lifecycleState: state, requiresLegalText: true }));
      expect(result[0]?.legalTextUpdateRequired, state).toBe(false);
    }
  });

  it("fordert kein Update, wenn ein freigabekonformer Slot existiert", () => {
    const result = items(makeDataset({ requiresLegalText: true, slotApproved: true }));
    expect(result[0]?.legalTextUpdateRequired).toBe(false);
  });

  it("fordert es weiterhin, wenn die Freigabe-Invariante verletzt ist (F-11)", () => {
    const result = items(makeDataset({ requiresLegalText: true, slotApprovedIncomplete: true }));
    expect(result[0]?.legalTextUpdateRequired).toBe(true);
  });
});

describe("§13.3 — Status transition_period erzeugt Umsetzungspriorität", () => {
  it("führt nicht zu low", () => {
    const result = items(
      makeDataset({
        lifecycleState: "transition_period",
        applicableDate: inDays(120),
        controlStates: ["not_started"],
      }),
    );
    expect(result[0]?.priority).not.toBe("low");
  });
});

describe("§13.3 / §9.3 — Fristenregeln", () => {
  it("erzeugt critical bei Frist unter 90 Tagen und offener Pflichtbedingung", () => {
    const result = items(
      makeDataset({
        applicableDate: inDays(30),
        requiresLegalText: true,
        requiresEvidence: true,
        controlStates: ["in_progress"],
      }),
    );
    expect(result[0]?.priority).toBe("critical");
    expect(result[0]?.deadlineHint).toBe(inDays(30));
  });

  it("behandelt eine überfällige Frist ebenfalls als critical", () => {
    const result = items(makeDataset({ applicableDate: inDays(-10), controlStates: ["in_progress"] }));
    expect(result[0]?.priority).toBe("critical");
  });

  it("erzeugt niemals critical ohne gesetzten deadlineHint", () => {
    const withoutDeadline = items(makeDataset({ controlStates: ["not_started"] }));
    expect(withoutDeadline[0]?.deadlineHint).toBeUndefined();
    expect(withoutDeadline[0]?.priority).not.toBe("critical");

    for (const item of buildRoadmap(seedDataset, PROFILE_ID, { clock })) {
      if (item.priority === "critical") expect(item.deadlineHint).toBeDefined();
    }
  });

  it("erzeugt high bei Frist unter 180 Tagen und unvorbereiteter Architektur", () => {
    const result = items(
      makeDataset({
        applicableDate: inDays(150),
        requiresLegalText: false,
        requiresEvidence: false,
        controlStates: ["not_started"],
      }),
    );
    expect(result[0]?.priority).toBe("high");
  });

  it("erzeugt medium, wenn Veröffentlichung absehbar und nichts Dringendes offen ist", () => {
    const result = items(
      makeDataset({
        lifecycleState: "adopted",
        requiresLegalText: false,
        requiresEvidence: false,
        controlStates: ["in_progress"],
      }),
    );
    expect(result[0]?.priority).toBe("medium");
  });

  it("fällt auf low zurück, wenn keine Regel greift", () => {
    const result = items(
      makeDataset({
        lifecycleState: "applicable",
        requiresLegalText: false,
        requiresEvidence: false,
        controlStates: ["implemented"],
      }),
    );
    expect(result[0]?.priority).toBe("low");
  });
});

describe("§9.5 — Ableitung des deadlineHint (F-04)", () => {
  const base: LegalAct = {
    id: "a",
    slug: "BFSG",
    name: "x",
    jurisdiction: "DE",
    sourceRecords: [],
    lifecycleState: "applicable",
    reviewStatus: "draft",
  };

  it("bevorzugt transitionEnd vor applicableDate vor effectiveDate", () => {
    expect(
      deriveDeadlineHint({
        ...base,
        transitionEnd: "2027-01-01",
        applicableDate: "2026-01-01",
        effectiveDate: "2025-01-01",
      }),
    ).toBe("2027-01-01");
    expect(deriveDeadlineHint({ ...base, applicableDate: "2026-01-01", effectiveDate: "2025-01-01" })).toBe(
      "2026-01-01",
    );
    expect(deriveDeadlineHint({ ...base, effectiveDate: "2025-01-01" })).toBe("2025-01-01");
  });

  it("bleibt leer, wenn kein Feld gesetzt ist", () => {
    expect(deriveDeadlineHint(base)).toBeUndefined();
  });

  it("behauptet im Entwurfsstadium keine Frist (§9.4.1)", () => {
    expect(deriveDeadlineHint({ ...base, lifecycleState: "draft", applicableDate: "2027-01-01" })).toBeUndefined();
    expect(deriveDeadlineHint({ ...base, lifecycleState: "observed", applicableDate: "2027-01-01" })).toBeUndefined();
  });
});

describe("§13.3 — nicht anwendbare Regulierung erzeugt keine Pflichtaufgabe", () => {
  it("liefert keine Items bei applicable:false", () => {
    const result = items(makeDataset({ assessment: { applicable: false, confidence: "high" } }));
    expect(result).toHaveLength(0);
  });

  it("liefert für ein Profil ohne KI keine AI-Act-Items", () => {
    const brochure = buildRoadmap(seedDataset, "profile-brochure-site", { clock });
    expect(brochure.filter((i) => i.legalActId === "act-eu-ai-act")).toHaveLength(0);
  });
});

describe("§13.3 — needsLegalReview blockiert finale Ausgabe", () => {
  it("setzt Label, Flag und Blocker", () => {
    const result = items(makeDataset({ assessment: { needsLegalReview: true } }));
    const item = result[0];
    expect(item?.applicability).toBe("needs_legal_review");
    expect(item?.legalReviewRequired).toBe(true);
    expect(item?.blockers.join(" ")).toContain("Rechtliche Prüfung");
    expect(item?.recommendedAction).toContain("Rechtliche Prüfung einholen");
  });

  it("behält die normal ermittelte Priorität (Interpretation IN-02)", () => {
    const result = items(
      makeDataset({ assessment: { needsLegalReview: true }, applicableDate: inDays(30) }),
    );
    expect(result[0]?.priority).toBe("critical");
  });
});

describe("§13.3 / F-12 — Guard gegen fehlende Pflichtbedingungen", () => {
  it("erreicht ohne requiresLegalText und ohne requiresEvidence nie critical über Regel 1", () => {
    const { items: result, diagnostics } = buildRoadmapResult(
      makeDataset({
        applicableDate: inDays(10),
        requiresLegalText: false,
        requiresEvidence: false,
        controlStates: ["not_started"],
      }),
      PROFILE_ID,
      { clock },
    );
    expect(result[0]?.priority).toBe("high");
    expect(diagnostics[0]?.priorityRule).toBe(2);
  });

  it("erreicht critical, sobald eine der beiden Bedingungen verlangt und offen ist", () => {
    const { items: result, diagnostics } = buildRoadmapResult(
      makeDataset({
        applicableDate: inDays(10),
        requiresLegalText: false,
        requiresEvidence: true,
        controlStates: ["not_started"],
      }),
      PROFILE_ID,
      { clock },
    );
    expect(result[0]?.priority).toBe("critical");
    expect(diagnostics[0]?.priorityRule).toBe(1);
  });
});

describe("§13.3 / F-14 — Aggregation bei mehreren Controls (§9.6)", () => {
  it("rechnet mit dem am wenigsten fortgeschrittenen Control", () => {
    const { items: result, diagnostics } = buildRoadmapResult(
      makeDataset({ controlStates: ["implemented", "blocked"], controlOwners: ["frontend", "frontend"] }),
      PROFILE_ID,
      { clock },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.complianceControlId).toBeUndefined();
    expect(diagnostics[0]?.worstControlState).toBe("blocked");
    expect(result[0]?.architecturePreparationRequired).toBe(true);
    expect(result[0]?.blockers.join(" ")).toContain("blockiert");
  });

  it("splittet bei unterschiedlichen Verantwortlichkeiten und referenziert die Kontrolle", () => {
    const result = items(
      makeDataset({ controlStates: ["prepared", "not_started"], controlOwners: ["frontend", "content"] }),
    );
    expect(result).toHaveLength(2);
    for (const item of result) expect(item.complianceControlId).toBeDefined();
  });

  it("referenziert bei genau einer Kontrolle deren id (F-14)", () => {
    const result = items(makeDataset({ controlStates: ["prepared"] }));
    expect(result[0]?.complianceControlId).toBe("ctl-test-0");
  });
});

describe("Determinismus und Sortierung", () => {
  it("liefert bei gleicher Eingabe identische Ausgabe", () => {
    const a = buildRoadmap(seedDataset, PROFILE_ID, { clock });
    const b = buildRoadmap(seedDataset, PROFILE_ID, { clock });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("sortiert nach Priorität", () => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    const result = buildRoadmap(seedDataset, PROFILE_ID, { clock });
    for (let i = 1; i < result.length; i += 1) {
      const previous = result[i - 1];
      const current = result[i];
      if (previous === undefined || current === undefined) continue;
      expect(order[previous.priority]).toBeLessThanOrEqual(order[current.priority]);
    }
  });

  it("kennt jedes Profil des Seeds", () => {
    for (const profile of projectProfiles) {
      expect(() => buildRoadmap(seedDataset, profile.id, { clock })).not.toThrow();
    }
    expect(() => buildRoadmap(seedDataset, "profile-unbekannt", { clock })).toThrow();
  });
});
