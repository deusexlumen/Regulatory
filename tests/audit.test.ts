/**
 * SPEC v2 §14 — Audit und Nachweis, inkl. der von F-05 ergänzten Zielobjekttypen.
 */
import { describe, expect, it } from "vitest";
import { AuditTrail } from "../src/audit/audit-trail.js";
import { RegulatoryStore } from "../src/audit/store.js";
import { fixedClock } from "../src/time/clock.js";
import { AUDIT_TARGET_TYPES } from "../src/domain/types.js";
import { seedDataset } from "../src/data/seed.js";
import type { ApplicabilityAssessment, LegalTextSlot } from "../src/domain/types.js";

const clock = fixedClock("2026-09-16", "2026-09-16T09:00:00.000Z");

describe("§6.12 — targetType deckt source_record und applicability_assessment ab (F-05)", () => {
  it("führt beide Typen im Enum", () => {
    expect(AUDIT_TARGET_TYPES).toContain("source_record");
    expect(AUDIT_TARGET_TYPES).toContain("applicability_assessment");
  });

  it("nutzt beide Typen im Seed-Trail", () => {
    const used = new Set(seedDataset.auditEntries.map((e) => e.targetType));
    expect(used.has("source_record")).toBe(true);
    expect(used.has("applicability_assessment")).toBe(true);
  });
});

describe("§14.2 — Auditinhalt", () => {
  it("enthält Zeitstempel, Akteur, Aktion, Zielobjekttyp und Zielobjekt-ID", () => {
    const trail = new AuditTrail({ clock });
    const entry = trail.record({
      actor: "developer",
      action: "update",
      targetType: "control",
      targetId: "ctl-1",
      reason: "Status geändert",
      sourceReferenceIds: ["src-1"],
    });
    expect(entry).toMatchObject({
      timestamp: "2026-09-16T09:00:00.000Z",
      actor: "developer",
      action: "update",
      targetType: "control",
      targetId: "ctl-1",
      reason: "Status geändert",
      sourceReferenceIds: ["src-1"],
    });
    expect(entry.id).toMatch(/^audit-\d{4}$/);
  });

  it("weist einen Eintrag ohne targetId zurück", () => {
    const trail = new AuditTrail({ clock });
    expect(() =>
      trail.record({ actor: "agent", action: "create", targetType: "task", targetId: "  " }),
    ).toThrow();
  });

  it("gibt Kopien heraus, damit der Trail nicht von außen verändert wird", () => {
    const trail = new AuditTrail({ clock });
    trail.record({ actor: "agent", action: "create", targetType: "task", targetId: "t-1" });
    const entries = trail.entries();
    const first = entries[0];
    if (first === undefined) throw new Error("leer");
    first.reason = "manipuliert";
    expect(trail.entries()[0]?.reason).toBeUndefined();
  });
});

describe("§14.1 — jede Mutation über den Store erzeugt einen AuditEntry", () => {
  it("protokolliert Erstellung jeder Entität", () => {
    const store = new RegulatoryStore({ clock });
    store.addSourceRecord({
      id: "src-1",
      sourceSystem: "BGBl",
      documentType: "official_publication",
      retrievedAt: "2026-09-16",
      confidence: "high",
    });
    store.addLegalAct({
      id: "act-1",
      slug: "BFSG",
      name: "Test",
      jurisdiction: "DE",
      sourceRecords: ["src-1"],
      lifecycleState: "applicable",
      reviewStatus: "draft",
    });
    store.addObligation({
      id: "obl-1",
      legalActId: "act-1",
      title: "Pflicht",
      sourceRecords: ["src-1"],
      affectedLayers: ["frontend"],
      lifecycleState: "applicable",
      actionableNow: true,
      prepareArchitectureOnly: false,
      requiresLegalText: true,
      requiresEvidence: true,
      needsLegalReview: false,
    });
    const trail = store.snapshot().auditEntries;
    expect(trail.filter((e) => e.action === "create")).toHaveLength(3);
    expect(trail.find((e) => e.targetType === "legal_act")?.sourceReferenceIds).toEqual(["src-1"]);
  });

  it("protokolliert Ablösung eines Assessments in zwei Schritten (§6.6, F-13)", () => {
    const store = new RegulatoryStore({ clock });
    const first: ApplicabilityAssessment = {
      id: "asmt-1",
      legalActId: "act-1",
      projectProfileId: "profile-1",
      applicable: true,
      confidence: "high",
      reasons: [],
      needsLegalReview: false,
      assessedAt: "2026-01-01",
    };
    store.addApplicabilityAssessment(first);
    store.supersedeAssessment("asmt-1", { ...first, id: "asmt-2", assessedAt: "2026-09-16" });

    const data = store.snapshot();
    expect(data.applicabilityAssessments.find((a) => a.id === "asmt-1")?.supersededBy).toBe("asmt-2");
    expect(
      data.auditEntries.filter((e) => e.targetType === "applicability_assessment").map((e) => e.action),
    ).toEqual(["create", "create", "update"]);
  });

  it("verhindert eine doppelte Ablösung", () => {
    const store = new RegulatoryStore({ clock });
    const base: ApplicabilityAssessment = {
      id: "asmt-1",
      legalActId: "act-1",
      projectProfileId: "profile-1",
      applicable: true,
      confidence: "high",
      reasons: [],
      needsLegalReview: false,
      assessedAt: "2026-01-01",
    };
    store.addApplicabilityAssessment(base);
    store.supersedeAssessment("asmt-1", { ...base, id: "asmt-2" });
    expect(() => store.supersedeAssessment("asmt-1", { ...base, id: "asmt-3" })).toThrow();
  });
});

describe("§12.3 — Slot-Freigabe über den Store erzwingt die Invariante (F-11)", () => {
  const slot: LegalTextSlot = {
    id: "slot-1",
    obligationId: "obl-1",
    slotKey: "bfsg.accessibility_statement",
    textSource: "not_set",
    status: "empty",
  };

  it("lehnt eine Freigabe ohne Referenz ab", () => {
    const store = new RegulatoryStore({ clock });
    store.addLegalTextSlot(slot);
    expect(() =>
      store.approveLegalTextSlot("slot-1", {
        approvedBy: "legal@example.test",
        approvedAt: "2026-09-16",
        textSource: "law_firm",
      }),
    ).toThrow(/sourceReference/);
  });

  it("setzt bei gültiger Freigabe alle Begleitfelder und protokolliert approve", () => {
    const store = new RegulatoryStore({ clock });
    store.addLegalTextSlot(slot);
    const approved = store.approveLegalTextSlot("slot-1", {
      approvedBy: "legal@example.test",
      approvedAt: "2026-09-16",
      sourceReference: "Kanzleifreigabe",
      textSource: "law_firm",
      version: "1.0.0",
    });
    expect(approved).toMatchObject({
      status: "approved",
      approvedBy: "legal@example.test",
      approvedAt: "2026-09-16",
      sourceReference: "Kanzleifreigabe",
      textSource: "law_firm",
    });
    const trail = store.snapshot().auditEntries;
    expect(
      trail.some(
        (e) => e.action === "approve" && e.targetType === "legal_text_slot" && e.actor === "legal_reviewer",
      ),
    ).toBe(true);
  });
});

describe("§14.1 — Review, Reject und Escalation sind protokollierbar", () => {
  it("nimmt alle Aktionen des Enums auf", () => {
    const store = new RegulatoryStore({ clock });
    for (const action of ["review", "reject", "escalate"] as const) {
      store.log({ actor: "legal_reviewer", action, targetType: "obligation", targetId: "obl-1" });
    }
    expect(store.snapshot().auditEntries.map((e) => e.action)).toEqual(["review", "reject", "escalate"]);
  });
});
