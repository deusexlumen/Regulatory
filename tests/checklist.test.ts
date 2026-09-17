/**
 * SPEC v2 §10 — Checklist-Generator.
 */
import { describe, expect, it } from "vitest";
import { generateAllChecklists, generateChecklist } from "../src/engine/checklist.js";
import { seedDataset } from "../src/data/seed.js";
import { cloneDataset } from "../src/domain/dataset.js";
import { ACT, CONTROL, PROFILE, SLOT } from "../src/data/ids.js";
import type { Checklist } from "../src/domain/types.js";

function checklistFor(slug: "BFSG" | "EU_AI_ACT" | "EU_DATA_ACT", profileId: string): Checklist {
  const act = seedDataset.legalActs.find((a) => a.slug === slug);
  if (act === undefined) throw new Error(`Rechtsakt ${slug} fehlt im Seed.`);
  return generateChecklist(seedDataset, act, profileId);
}

describe("§15.3 — drei Checklisten pro Profil", () => {
  it("erzeugt BFSG-, AI-Act- und Data-Act-Checkliste", () => {
    const checklists = generateAllChecklists(seedDataset, PROFILE.demoShop);
    expect(checklists.map((c) => c.title)).toEqual([
      "BFSG Checklist",
      "AI Act Checklist",
      "Data Act Checklist",
    ]);
  });
});

describe("§10.3 — BFSG-Checkliste", () => {
  const required = [
    "Accessibility-Struktur im Layout vorhanden",
    "Footer-Slot für AccessibilityStatement vorhanden",
    "Feedback- oder Kontaktmechanismus vorbereitet",
    "Alternativzugänge berücksichtigt",
    "Farbkontraste prüfbar",
    "Tastaturbedienung prüfbar",
    "Formular-Labels vorhanden",
    "Fokus-States vorhanden",
    "Semantische Überschriftenstruktur vorhanden",
    "Media-Alternativen vorbereitet",
    "Accessibility-Test-Setup vorhanden",
    "Rechtstext-Slot nicht eigenmächtig befüllt",
  ];

  it("enthält mindestens die geforderten Punkte", () => {
    const titles = checklistFor("BFSG", PROFILE.demoShop).items.map((i) => i.title);
    for (const title of required) expect(titles).toContain(title);
  });
});

describe("§10.4 — AI-Act-Checkliste", () => {
  const required = [
    "KI-Funktion inventarisiert",
    "KI-Einsatz im Projektprofil erfasst",
    "Chatbot-Kennzeichnung vorbereitet",
    "Hinweis auf synthetische Inhalte vorbereitet",
    "Kontextuelle Disclosure-Komponente vorbereitet",
    "Systembeschreibung als Slot vorhanden",
    "Nutzerhinweis vor Interaktion vorbereitet",
    "Logging- oder Nachweisstruktur vorbereitet",
    "Rechtstext-Slot nicht eigenmächtig befüllt",
  ];

  it("enthält mindestens die geforderten Punkte", () => {
    const titles = checklistFor("EU_AI_ACT", PROFILE.demoShop).items.map((i) => i.title);
    for (const title of required) expect(titles).toContain(title);
  });
});

describe("§10.5 — Data-Act-Checkliste", () => {
  const required = [
    "Relevante Datenkategorien identifiziert",
    "IoT-Bezug geprüft",
    "Nutzerdaten-Bezug geprüft",
    "Datenzugriffspflichten geprüft",
    "Transparenzhinweise vorbereitet",
    "Datenportabilität geprüft",
    "Third-Party-Sharing geprüft",
    "Dokumentation der Datenflüsse vorbereitet",
    "Rechtstext-Slot nicht eigenmächtig befüllt",
    "Needs-Legal-Review-Flag bei Unsicherheit gesetzt",
  ];

  it("enthält mindestens die geforderten Punkte", () => {
    const titles = checklistFor("EU_DATA_ACT", PROFILE.demoShop).items.map((i) => i.title);
    for (const title of required) expect(titles).toContain(title);
  });
});

describe("§10.2 — Zustand wird abgeleitet, nicht gesetzt", () => {
  it("spiegelt den Control-Status (§7.4)", () => {
    const item = checklistFor("EU_DATA_ACT", PROFILE.demoShop).items.find(
      (i) => i.title === "Third-Party-Sharing geprüft",
    );
    const control = seedDataset.complianceControls.find((c) => c.id === CONTROL.dataSharingRegister);
    expect(control?.implementationState).toBe("blocked");
    expect(item?.state).toBe("blocked");
  });

  it("bildet implemented auf done ab", () => {
    const modified = cloneDataset(seedDataset);
    const control = modified.complianceControls.find((c) => c.id === CONTROL.bfsgA11yStructure);
    if (control === undefined) throw new Error("Kontrolle fehlt");
    control.implementationState = "implemented";
    const act = modified.legalActs.find((a) => a.id === ACT.bfsg);
    if (act === undefined) throw new Error("Rechtsakt fehlt");
    const item = generateChecklist(modified, act, PROFILE.demoShop).items.find(
      (i) => i.title === "Accessibility-Struktur im Layout vorhanden",
    );
    expect(item?.state).toBe("done");
  });

  it("spiegelt den LegalTextSlot-Status", () => {
    const item = checklistFor("BFSG", PROFILE.demoShop).items.find(
      (i) => i.title === "Rechtstext-Slot nicht eigenmächtig befüllt",
    );
    expect(item?.state).toBe("not_started");

    const modified = cloneDataset(seedDataset);
    const slot = modified.legalTextSlots.find((s) => s.id === SLOT.bfsgAccessibilityStatement);
    if (slot === undefined) throw new Error("Slot fehlt");
    slot.status = "approved";
    slot.textSource = "law_firm";
    slot.approvedBy = "legal@example.test";
    slot.approvedAt = "2026-09-16";
    slot.sourceReference = "Kanzleifreigabe";
    const act = modified.legalActs.find((a) => a.id === ACT.bfsg);
    if (act === undefined) throw new Error("Rechtsakt fehlt");
    const approved = generateChecklist(modified, act, PROFILE.demoShop).items.find(
      (i) => i.title === "Rechtstext-Slot nicht eigenmächtig befüllt",
    );
    expect(approved?.state).toBe("done");
  });

  it("wertet einen approved Slot ohne Begleitfelder nicht als done (F-11)", () => {
    const modified = cloneDataset(seedDataset);
    const slot = modified.legalTextSlots.find((s) => s.id === SLOT.bfsgAccessibilityStatement);
    if (slot === undefined) throw new Error("Slot fehlt");
    slot.status = "approved";
    slot.textSource = "law_firm";
    const act = modified.legalActs.find((a) => a.id === ACT.bfsg);
    if (act === undefined) throw new Error("Rechtsakt fehlt");
    const item = generateChecklist(modified, act, PROFILE.demoShop).items.find(
      (i) => i.title === "Rechtstext-Slot nicht eigenmächtig befüllt",
    );
    expect(item?.state).toBe("needs_review");
  });
});

describe("§8.3 Regel 6 — nicht anwendbar erzeugt keine Punkte", () => {
  it("liefert für den AI Act beim Profil ohne KI eine leere Checkliste mit Begründung", () => {
    const checklist = checklistFor("EU_AI_ACT", PROFILE.brochureSite);
    expect(checklist.items).toHaveLength(0);
    expect(checklist.skippedReason).toContain("Nicht anwendbar");
  });
});

describe("§8.3 Regel 4 — Unsicherheit schlägt auf jeden Punkt durch", () => {
  it("setzt needsLegalReview an allen Punkten, wenn die Bewertung unsicher ist", () => {
    const checklist = checklistFor("BFSG", PROFILE.brochureSite);
    expect(checklist.items.length).toBeGreaterThan(0);
    for (const item of checklist.items) expect(item.needsLegalReview).toBe(true);
  });

  it("markiert das Konsistenz-Flag der Data-Act-Checkliste als done", () => {
    const item = checklistFor("EU_DATA_ACT", PROFILE.brochureSite).items.find(
      (i) => i.title === "Needs-Legal-Review-Flag bei Unsicherheit gesetzt",
    );
    expect(item?.state).toBe("done");
  });
});

describe("§10.2 — regulationId referenziert die Instanz, nicht den Slug", () => {
  it("trägt die LegalAct.id", () => {
    for (const item of checklistFor("BFSG", PROFILE.demoShop).items) {
      expect(item.regulationId).toBe(ACT.bfsg);
    }
  });
});
