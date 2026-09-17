/**
 * SPEC v2 §13.2 — Policy-Tests.
 */
import { describe, expect, it } from "vitest";
import { seedDataset } from "../src/data/seed.js";
import { formatViolations, validatePolicies } from "../src/policy/validate.js";
import { cloneDataset } from "../src/domain/dataset.js";
import { opensContentWindow } from "../src/domain/lifecycle-states.js";
import { isSlotReleaseCompliant } from "../src/engine/roadmap.js";

describe("§13.2 Pflichtprüfungen gegen die Seed-Daten", () => {
  it("meldet keinen Policy-Verstoß", () => {
    expect(formatViolations(validatePolicies(seedDataset))).toBe("Keine Verstöße.");
  });

  it("keine Obligation ohne Quelle", () => {
    for (const obligation of seedDataset.obligations) {
      expect(obligation.sourceRecords.length).toBeGreaterThan(0);
    }
  });

  it("kein Rechtsstatus ohne nachvollziehbare Quelle", () => {
    for (const act of seedDataset.legalActs) {
      expect(act.sourceRecords.length).toBeGreaterThan(0);
    }
  });

  it("keine finale Rechtstextkomponente ohne approved Slot", () => {
    for (const slot of seedDataset.legalTextSlots) {
      if (slot.status === "approved") expect(isSlotReleaseCompliant(slot)).toBe(true);
    }
  });

  it("jede Unsicherheit erzeugt needsLegalReview", () => {
    for (const assessment of seedDataset.applicabilityAssessments) {
      if (assessment.confidence === "low") expect(assessment.needsLegalReview).toBe(true);
    }
  });

  it("jede Entwurfsmaßnahme erzeugt prepareArchitectureOnly", () => {
    for (const obligation of seedDataset.obligations) {
      if (obligation.lifecycleState === "draft" || obligation.lifecycleState === "observed") {
        expect(obligation.prepareArchitectureOnly).toBe(true);
      }
    }
  });

  it("jede veröffentlichte Regulierung öffnet das Content-Update-Fenster", () => {
    for (const act of seedDataset.legalActs) {
      if (!opensContentWindow(act.lifecycleState)) continue;
      const withText = seedDataset.obligations.filter(
        (o) => o.legalActId === act.id && o.requiresLegalText,
      );
      for (const obligation of withText) {
        expect(
          seedDataset.legalTextSlots.some((s) => s.obligationId === obligation.id),
          `${obligation.id} ohne LegalTextSlot`,
        ).toBe(true);
      }
    }
  });

  it("jede applicable Regulierung erzeugt Evidence-Erfordernis", () => {
    for (const obligation of seedDataset.obligations) {
      if (obligation.lifecycleState === "applicable") {
        expect(obligation.requiresEvidence, obligation.id).toBe(true);
      }
    }
  });

  it("jedes SourceRecord und jedes ApplicabilityAssessment hat einen AuditEntry (F-05)", () => {
    const targets = new Set(seedDataset.auditEntries.map((e) => `${e.targetType}:${e.targetId}`));
    for (const record of seedDataset.sourceRecords) {
      expect(targets.has(`source_record:${record.id}`), record.id).toBe(true);
    }
    for (const assessment of seedDataset.applicabilityAssessments) {
      expect(targets.has(`applicability_assessment:${assessment.id}`), assessment.id).toBe(true);
    }
  });

  it("protokolliert die Ablösung eines Assessments als update (F-05, F-13)", () => {
    const superseded = seedDataset.applicabilityAssessments.filter((a) => a.supersededBy !== undefined);
    expect(superseded.length).toBeGreaterThan(0);
    for (const assessment of superseded) {
      expect(
        seedDataset.auditEntries.some(
          (e) =>
            e.targetType === "applicability_assessment" &&
            e.targetId === assessment.id &&
            e.action === "update",
        ),
      ).toBe(true);
    }
  });
});

describe("§13.2 erkennt eingebaute Verstöße", () => {
  it("meldet eine Unsicherheit ohne needsLegalReview", () => {
    const broken = cloneDataset(seedDataset);
    const assessment = broken.applicabilityAssessments[0];
    if (assessment === undefined) throw new Error("Seed leer");
    assessment.confidence = "low";
    assessment.needsLegalReview = false;
    expect(validatePolicies(broken).some((v) => v.message.includes("needsLegalReview ist false"))).toBe(true);
  });

  it("meldet ein SourceRecord ohne AuditEntry (F-05)", () => {
    const broken = cloneDataset(seedDataset);
    broken.sourceRecords.push({
      id: "src-unprotokolliert",
      sourceSystem: "Manual",
      documentType: "guidance",
      retrievedAt: "2026-09-16",
      confidence: "low",
    });
    expect(
      validatePolicies(broken).some(
        (v) => v.targetId === "src-unprotokolliert" && v.message.includes("Kein AuditEntry"),
      ),
    ).toBe(true);
  });

  it("meldet einen approved Slot ohne Begleitfelder (F-11)", () => {
    const broken = cloneDataset(seedDataset);
    const slot = broken.legalTextSlots[0];
    if (slot === undefined) throw new Error("Seed leer");
    slot.status = "approved";
    slot.textSource = "law_firm";
    const violations = validatePolicies(broken);
    expect(violations.some((v) => v.message.includes("approvedBy"))).toBe(true);
  });

  it("meldet zwei gültige Assessments für dieselbe Kombination (§6.6)", () => {
    const broken = cloneDataset(seedDataset);
    const assessment = broken.applicabilityAssessments.find((a) => a.supersededBy === undefined);
    if (assessment === undefined) throw new Error("Seed leer");
    broken.applicabilityAssessments.push({ ...assessment, id: `${assessment.id}-dup` });
    expect(
      validatePolicies(broken).some((v) => v.message.includes("nicht abgelöste Assessments")),
    ).toBe(true);
  });

  it("meldet einen verlassenen needs_legal_review ohne Freigabe (F-06)", () => {
    const broken = cloneDataset(seedDataset);
    const act = broken.legalActs[0];
    if (act === undefined) throw new Error("Seed leer");
    broken.auditEntries.push({
      id: "audit-fake",
      timestamp: "2026-09-16T10:00:00.000Z",
      actor: "agent",
      action: "update",
      targetType: "legal_act",
      targetId: act.id,
      reason: "Lifecycle applicable -> needs_legal_review.",
    });
    expect(
      validatePolicies(broken).some((v) => v.message.includes("needs_legal_review verlassen")),
    ).toBe(true);
  });
});
