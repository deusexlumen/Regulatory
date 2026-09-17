/**
 * SPEC v2 §15 — Output Contract.
 */
import { describe, expect, it } from "vitest";
import { renderMarkdownRoadmap } from "../src/reports/markdown-roadmap.js";
import { buildJsonExport, renderJsonExport } from "../src/reports/json-export.js";
import { renderChecklistsMarkdown } from "../src/reports/checklist-report.js";
import { collectOpenQuestions, renderOpenQuestions } from "../src/reports/open-questions.js";
import { seedDataset } from "../src/data/seed.js";
import { PROFILE } from "../src/data/ids.js";
import { fixedClock } from "../src/time/clock.js";
import { SPEC_VERIFICATION_FINDINGS } from "../src/data/source-verification.js";

const clock = fixedClock("2026-09-16");
const options = { clock };

describe("§15.1 — Markdown Roadmap", () => {
  const markdown = renderMarkdownRoadmap(seedDataset, PROFILE.demoShop, options);

  it("enthält alle geforderten Inhaltsblöcke", () => {
    for (const fragment of [
      "Regulierungen und Anwendbarkeit",
      "Anwendbarkeit",
      "Frist",
      "Lifecycle",
      "Priorität",
      "Empfohlene Aktion",
      "Architekturvorbereitung",
      "Rechtstextbedarf",
      "Review-Bedarf",
      "Blocker",
      "Nächste Schritte",
    ]) {
      expect(markdown).toContain(fragment);
    }
  });

  it("weist auf den fehlenden Rechtsberatungscharakter hin (§1, §3)", () => {
    expect(markdown).toContain("Kein Rechtsrat");
  });

  it("nennt alle drei Rechtsakte", () => {
    for (const slug of ["BFSG", "EU_AI_ACT", "EU_DATA_ACT"]) expect(markdown).toContain(slug);
  });

  it("behauptet keine Frist, wo keine abgeleitet werden kann", () => {
    const draft = structuredClone(seedDataset);
    for (const act of draft.legalActs) {
      act.lifecycleState = "draft";
      delete act.transitionEnd;
      delete act.applicableDate;
      delete act.effectiveDate;
    }
    for (const obligation of draft.obligations) {
      obligation.lifecycleState = "draft";
      obligation.prepareArchitectureOnly = true;
    }
    const output = renderMarkdownRoadmap(draft, PROFILE.demoShop, options);
    expect(output).toContain("keine bestätigte Frist");
  });

  it("bleibt bei gleicher Eingabe stabil", () => {
    expect(renderMarkdownRoadmap(seedDataset, PROFILE.demoShop, options)).toBe(markdown);
  });
});

describe("§15.2 — JSON Regulatory Data", () => {
  const exported = buildJsonExport(seedDataset, PROFILE.demoShop, options);

  it("enthält alle geforderten Sammlungen", () => {
    for (const key of [
      "legalActs",
      "sourceRecords",
      "obligations",
      "complianceControls",
      "implementationTasks",
      "legalTextSlots",
      "evidenceArtifacts",
      "auditEntries",
      "projectProfiles",
      "applicabilityAssessments",
    ] as const) {
      expect(exported[key].length, key).toBeGreaterThan(0);
    }
  });

  it("liefert Roadmap und Checklisten mit", () => {
    expect(exported.roadmapItems.length).toBeGreaterThan(0);
    expect(exported.checklists).toHaveLength(3);
  });

  it("ist gültiges, rundreisefähiges JSON", () => {
    const text = renderJsonExport(seedDataset, PROFILE.demoShop, options);
    expect(() => JSON.parse(text)).not.toThrow();
    expect(JSON.parse(text).meta.timeZone).toBe("Europe/Berlin");
  });
});

describe("§15.3 — Checklists", () => {
  const markdown = renderChecklistsMarkdown(seedDataset, PROFILE.demoShop);

  it("enthält alle drei Checklisten", () => {
    expect(markdown).toContain("BFSG Checklist");
    expect(markdown).toContain("AI Act Checklist");
    expect(markdown).toContain("Data Act Checklist");
  });

  it("weist eine nicht anwendbare Regulierung mit Begründung aus", () => {
    const brochure = renderChecklistsMarkdown(seedDataset, PROFILE.brochureSite);
    expect(brochure).toContain("Keine Punkte erzeugt");
  });
});

describe("§15.4 — Open Questions Report", () => {
  const markdown = renderOpenQuestions(seedDataset, PROFILE.demoShop, options);
  const questions = collectOpenQuestions(seedDataset, PROFILE.demoShop, options);

  it("enthält alle geforderten Kategorien", () => {
    for (const heading of [
      "Fehlende Quellen",
      "Unklare Fristen",
      "Unklare Anwendbarkeit",
      "Rechtlicher Prüfbedarf",
      "Fehlende Freigaben",
      "Technische Blocker",
    ]) {
      expect(markdown).toContain(heading);
    }
  });

  it("listet die offenen Punkte tatsächlich auf", () => {
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some((q) => q.category === "missing_approval")).toBe(true);
    expect(questions.some((q) => q.category === "technical_blocker")).toBe(true);
    expect(questions.some((q) => q.category === "legal_review")).toBe(true);
  });

  it("dokumentiert die Gegenprüfung der Arbeitsstand-Daten aus §5 (§16 Schritt 4)", () => {
    expect(markdown).toContain("Gegenprüfung der Arbeitsstand-Daten");
    for (const finding of SPEC_VERIFICATION_FINDINGS) expect(markdown).toContain(finding.id);
  });

  it("benennt die korrigierte AI-Act-Angabe ausdrücklich", () => {
    const corrected = SPEC_VERIFICATION_FINDINGS.find((f) => f.id === "V-04");
    expect(corrected?.result).toBe("corrected");
    expect(markdown).toContain("02.08.2026");
  });

  it("verschweigt keine fehlende Freigabe (§3 Nicht-Ziel 9)", () => {
    for (const slot of seedDataset.legalTextSlots) {
      expect(questions.some((q) => q.targetId === slot.id)).toBe(true);
    }
  });
});
