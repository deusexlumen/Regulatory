/**
 * SPEC v2 §13.1 — Schema-Tests.
 */
import { describe, expect, it } from "vitest";
import { seedDataset } from "../src/data/seed.js";
import { validateSchema } from "../src/policy/validate.js";
import { formatViolations } from "../src/policy/validate.js";
import { cloneDataset } from "../src/domain/dataset.js";
import { isLegalActSlug } from "../src/domain/slugs.js";
import { AUDIT_TARGET_TYPES } from "../src/domain/types.js";

describe("§13.1 Pflichtprüfungen gegen die Seed-Daten", () => {
  it("meldet keinen Schemaverstoß", () => {
    const violations = validateSchema(seedDataset);
    expect(formatViolations(violations)).toBe("Keine Verstöße.");
  });

  it("jedes LegalAct besitzt id und gültigen slug (§6.1)", () => {
    for (const act of seedDataset.legalActs) {
      expect(act.id).not.toBe("");
      expect(isLegalActSlug(act.slug)).toBe(true);
    }
  });

  it("jedes LegalAct besitzt mindestens einen SourceRecord", () => {
    const known = new Set(seedDataset.sourceRecords.map((s) => s.id));
    for (const act of seedDataset.legalActs) {
      expect(act.sourceRecords.length).toBeGreaterThan(0);
      for (const ref of act.sourceRecords) expect(known.has(ref)).toBe(true);
    }
  });

  it("jede Obligation besitzt legalActId und SourceRecords", () => {
    const actIds = new Set(seedDataset.legalActs.map((a) => a.id));
    for (const obligation of seedDataset.obligations) {
      expect(actIds.has(obligation.legalActId)).toBe(true);
      expect(obligation.sourceRecords.length).toBeGreaterThan(0);
    }
  });

  it("jede ComplianceControl besitzt eine obligationId", () => {
    const obligationIds = new Set(seedDataset.obligations.map((o) => o.id));
    for (const control of seedDataset.complianceControls) {
      expect(obligationIds.has(control.obligationId)).toBe(true);
    }
  });

  it("jeder LegalTextSlot besitzt einen Status", () => {
    for (const slot of seedDataset.legalTextSlots) {
      expect(["empty", "draft", "needs_review", "approved"]).toContain(slot.status);
    }
  });

  it("jedes EvidenceArtifact besitzt einen Typ", () => {
    for (const artifact of seedDataset.evidenceArtifacts) {
      expect(artifact.type).toBeTruthy();
    }
  });

  it("jeder AuditEntry besitzt targetType und targetId", () => {
    expect(seedDataset.auditEntries.length).toBeGreaterThan(0);
    for (const entry of seedDataset.auditEntries) {
      expect(AUDIT_TARGET_TYPES).toContain(entry.targetType);
      expect(entry.targetId).not.toBe("");
    }
  });
});

describe("§13.1 erkennt eingebaute Fehler", () => {
  it("meldet ein LegalAct ohne Quelle (§4.1, F-15)", () => {
    const broken = cloneDataset(seedDataset);
    const act = broken.legalActs[0];
    if (act === undefined) throw new Error("Seed leer");
    act.sourceRecords = [];
    const violations = validateSchema(broken);
    expect(violations.some((v) => v.message.includes("ohne SourceRecord"))).toBe(true);
  });

  it("meldet einen unbekannten slug", () => {
    const broken = cloneDataset(seedDataset);
    const act = broken.legalActs[0];
    if (act === undefined) throw new Error("Seed leer");
    (act as { slug: string }).slug = "BFSG_NEU";
    expect(validateSchema(broken).some((v) => v.message.includes("Unbekannter slug"))).toBe(true);
  });

  it("meldet einen Rechtsakt-Zustand im Control-Feld (F-01)", () => {
    const broken = cloneDataset(seedDataset);
    const control = broken.complianceControls[0];
    if (control === undefined) throw new Error("Seed leer");
    (control as { implementationState: string }).implementationState = "applicable";
    expect(
      validateSchema(broken).some((v) => v.message.includes("gehört zur Rechtsakt-Maschine")),
    ).toBe(true);
  });

  it("akzeptiert blocked im Control-Feld, weil es in beiden Maschinen existiert", () => {
    const blockedControls = seedDataset.complianceControls.filter(
      (c) => c.implementationState === "blocked",
    );
    expect(blockedControls.length).toBeGreaterThan(0);
    expect(validateSchema(seedDataset)).toHaveLength(0);
  });

  it("meldet ein Datum ohne ISO-8601-Format (§9.5.1)", () => {
    const broken = cloneDataset(seedDataset);
    const act = broken.legalActs[0];
    if (act === undefined) throw new Error("Seed leer");
    act.applicableDate = "28.06.2025";
    expect(validateSchema(broken).some((v) => v.message.includes("ISO-8601"))).toBe(true);
  });

  it("meldet einen slotKey, der die Konvention verletzt (§11.1)", () => {
    const broken = cloneDataset(seedDataset);
    const slot = broken.legalTextSlots[0];
    if (slot === undefined) throw new Error("Seed leer");
    slot.slotKey = "BFSG-Accessibility";
    expect(validateSchema(broken).some((v) => v.message.includes("Konvention"))).toBe(true);
  });
});
