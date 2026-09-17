/**
 * SPEC v2 §13.1/§13.2 — Schema- und Policy-Prüfungen als wiederverwendbare
 * Funktionen.
 *
 * Sie werden sowohl von den Tests (§13) als auch vom CLI-Gate
 * (`npm run validate`) genutzt. Die Prüfungen laufen gegen Daten, nicht gegen
 * Typen: §4.1 hält ausdrücklich fest, dass die Quellenpflicht testseitig und
 * nicht typseitig erzwungen wird (F-15) — ein `LegalAct` ohne Quelle ist zur
 * Laufzeit erzeugbar, aber nicht releasefähig.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import { isLegalActSlug } from "../domain/slugs.js";
import {
  CONTROL_IMPLEMENTATION_STATES,
  REGULATORY_LIFECYCLE_STATES,
  isControlImplementationState,
  isRegulatoryLifecycleState,
  opensContentWindow,
} from "../domain/lifecycle-states.js";
import { AUDIT_TARGET_TYPES } from "../domain/types.js";
import type { LegalTextSlot } from "../domain/types.js";
import { isIsoDate, isIsoTimestamp } from "../time/clock.js";
import { isSlotReleaseCompliant } from "../engine/roadmap.js";
import { currentAssessment } from "../engine/applicability.js";

export interface Violation {
  /** Abschnitt der Spezifikation, aus dem die Regel stammt. */
  rule: string;
  targetType: string;
  targetId: string;
  message: string;
}

/**
 * Zustände, die ausschließlich zur Rechtsakt-Maschine gehören. `blocked` ist in
 * beiden Maschinen definiert (§7.1.2 und §7.4) und daher nicht enthalten.
 */
const LEGAL_ACT_EXCLUSIVE_STATES = new Set<string>(
  REGULATORY_LIFECYCLE_STATES.filter(
    (state) => !(CONTROL_IMPLEMENTATION_STATES as readonly string[]).includes(state),
  ),
);

function isLegalActExclusiveState(value: string): boolean {
  return LEGAL_ACT_EXCLUSIVE_STATES.has(value);
}

function ids<T extends { id: string }>(items: readonly T[]): Set<string> {
  return new Set(items.map((i) => i.id));
}

/** §13.1 — Schema-Tests. */
export function validateSchema(dataset: RegulatoryDataset): Violation[] {
  const v: Violation[] = [];
  const sourceIds = ids(dataset.sourceRecords);
  const actIds = ids(dataset.legalActs);
  const obligationIds = ids(dataset.obligations);
  const profileIds = ids(dataset.projectProfiles);
  const controlIds = ids(dataset.complianceControls);

  for (const act of dataset.legalActs) {
    if (act.id.trim() === "") {
      v.push({ rule: "§13.1", targetType: "legal_act", targetId: "(leer)", message: "LegalAct ohne id." });
    }
    if (!isLegalActSlug(act.slug)) {
      v.push({
        rule: "§13.1/§6.1",
        targetType: "legal_act",
        targetId: act.id,
        message: `Unbekannter slug "${String(act.slug)}" — nur LegalActSlug-Werte sind zulässig.`,
      });
    }
    if (!isRegulatoryLifecycleState(act.lifecycleState)) {
      v.push({
        rule: "§13.1/§6.4",
        targetType: "legal_act",
        targetId: act.id,
        message: `Unbekannter lifecycleState "${String(act.lifecycleState)}".`,
      });
    }
    if (act.sourceRecords.length === 0) {
      v.push({
        rule: "§13.1/§4.1",
        targetType: "legal_act",
        targetId: act.id,
        message: "LegalAct ohne SourceRecord — nicht releasefähig.",
      });
    }
    for (const ref of act.sourceRecords) {
      if (!sourceIds.has(ref)) {
        v.push({
          rule: "§13.1",
          targetType: "legal_act",
          targetId: act.id,
          message: `Referenzierter SourceRecord ${ref} existiert nicht.`,
        });
      }
    }
    for (const [field, value] of [
      ["effectiveDate", act.effectiveDate],
      ["applicableDate", act.applicableDate],
      ["transitionEnd", act.transitionEnd],
    ] as const) {
      if (value !== undefined && !isIsoDate(value)) {
        v.push({
          rule: "§13.1/§9.5.1",
          targetType: "legal_act",
          targetId: act.id,
          message: `${field} ist kein ISO-8601-Datum (YYYY-MM-DD): "${value}".`,
        });
      }
    }
    if (act.lifecycleState === "needs_legal_review" && act.preReviewState === undefined) {
      v.push({
        rule: "§7.3.1",
        targetType: "legal_act",
        targetId: act.id,
        message: "Zustand needs_legal_review ohne preReviewState — Rückkehr wäre nicht bestimmbar.",
      });
    }
  }

  for (const record of dataset.sourceRecords) {
    if (!isIsoTimestamp(record.retrievedAt)) {
      v.push({
        rule: "§13.1/§9.5.1",
        targetType: "source_record",
        targetId: record.id,
        message: `retrievedAt ist kein ISO-8601-Wert: "${record.retrievedAt}".`,
      });
    }
    if (record.publicationDate !== undefined && !isIsoDate(record.publicationDate)) {
      v.push({
        rule: "§13.1/§9.5.1",
        targetType: "source_record",
        targetId: record.id,
        message: `publicationDate ist kein ISO-8601-Datum: "${record.publicationDate}".`,
      });
    }
  }

  for (const obligation of dataset.obligations) {
    if (!actIds.has(obligation.legalActId)) {
      v.push({
        rule: "§13.1",
        targetType: "obligation",
        targetId: obligation.id,
        message: `legalActId ${obligation.legalActId} existiert nicht.`,
      });
    }
    if (obligation.sourceRecords.length === 0) {
      v.push({
        rule: "§13.1/§13.2",
        targetType: "obligation",
        targetId: obligation.id,
        message: "Obligation ohne Quelle.",
      });
    }
    for (const ref of obligation.sourceRecords) {
      if (!sourceIds.has(ref)) {
        v.push({
          rule: "§13.1",
          targetType: "obligation",
          targetId: obligation.id,
          message: `Referenzierter SourceRecord ${ref} existiert nicht.`,
        });
      }
    }
  }

  for (const control of dataset.complianceControls) {
    if (!obligationIds.has(control.obligationId)) {
      v.push({
        rule: "§13.1",
        targetType: "control",
        targetId: control.id,
        message: `obligationId ${control.obligationId} existiert nicht.`,
      });
    }
    if (!isControlImplementationState(control.implementationState)) {
      v.push({
        rule: "§13.1/§7.4",
        targetType: "control",
        targetId: control.id,
        message: `Unbekannter implementationState "${String(control.implementationState)}".`,
      });
    }
    // Schutz gegen F-01: Zustände, die es NUR in der Rechtsakt-Maschine gibt,
    // dürfen hier nicht auftauchen. `blocked` gehört zu beiden Maschinen und
    // ist daher ausgenommen.
    if (isLegalActExclusiveState(control.implementationState as string)) {
      v.push({
        rule: "§4.3/§7",
        targetType: "control",
        targetId: control.id,
        message:
          `implementationState "${String(control.implementationState)}" gehört zur Rechtsakt-Maschine — ` +
          "die beiden Zustandsmaschinen dürfen nicht vermischt werden.",
      });
    }
  }

  for (const task of dataset.implementationTasks) {
    if (!controlIds.has(task.complianceControlId)) {
      v.push({
        rule: "§13.1",
        targetType: "task",
        targetId: task.id,
        message: `complianceControlId ${task.complianceControlId} existiert nicht.`,
      });
    }
  }

  for (const slot of dataset.legalTextSlots) {
    if (!["empty", "draft", "needs_review", "approved"].includes(slot.status)) {
      v.push({
        rule: "§13.1",
        targetType: "legal_text_slot",
        targetId: slot.id,
        message: `LegalTextSlot ohne gültigen Status: "${String(slot.status)}".`,
      });
    }
    if (!obligationIds.has(slot.obligationId)) {
      v.push({
        rule: "§13.1",
        targetType: "legal_text_slot",
        targetId: slot.id,
        message: `obligationId ${slot.obligationId} existiert nicht.`,
      });
    }
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(slot.slotKey)) {
      v.push({
        rule: "§11.1",
        targetType: "legal_text_slot",
        targetId: slot.id,
        message: `slotKey "${slot.slotKey}" verletzt die Konvention "<slug_lowercase>.<zweck>".`,
      });
    }
  }

  for (const artifact of dataset.evidenceArtifacts) {
    if (artifact.type === undefined) {
      v.push({
        rule: "§13.1",
        targetType: "evidence",
        targetId: artifact.id,
        message: "EvidenceArtifact ohne Typ.",
      });
    }
    if (!isIsoTimestamp(artifact.createdAt)) {
      v.push({
        rule: "§13.1/§9.5.1",
        targetType: "evidence",
        targetId: artifact.id,
        message: `createdAt ist kein ISO-8601-Wert: "${artifact.createdAt}".`,
      });
    }
  }

  for (const entry of dataset.auditEntries) {
    if (!AUDIT_TARGET_TYPES.includes(entry.targetType)) {
      v.push({
        rule: "§13.1/§6.12",
        targetType: "audit",
        targetId: entry.id,
        message: `Unbekannter targetType "${String(entry.targetType)}".`,
      });
    }
    if (entry.targetId.trim() === "") {
      v.push({
        rule: "§13.1/§14.2",
        targetType: "audit",
        targetId: entry.id,
        message: "AuditEntry ohne targetId.",
      });
    }
    if (!isIsoTimestamp(entry.timestamp)) {
      v.push({
        rule: "§13.1/§14.2",
        targetType: "audit",
        targetId: entry.id,
        message: `timestamp ist kein ISO-8601-Wert: "${entry.timestamp}".`,
      });
    }
  }

  for (const assessment of dataset.applicabilityAssessments) {
    if (!actIds.has(assessment.legalActId)) {
      v.push({
        rule: "§13.1",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: `legalActId ${assessment.legalActId} existiert nicht.`,
      });
    }
    if (!profileIds.has(assessment.projectProfileId)) {
      v.push({
        rule: "§13.1",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: `projectProfileId ${assessment.projectProfileId} existiert nicht.`,
      });
    }
    if (!isIsoTimestamp(assessment.assessedAt)) {
      v.push({
        rule: "§13.1/§9.5.1",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: `assessedAt ist kein ISO-8601-Wert: "${assessment.assessedAt}".`,
      });
    }
  }

  return v;
}

/** §12.3 / §13.5 — Freigabekonformität eines Slots als Klartextbefund. */
export function slotReleaseViolation(slot: LegalTextSlot): string | undefined {
  if (slot.status !== "approved") return undefined;
  if (isSlotReleaseCompliant(slot)) return undefined;
  const missing: string[] = [];
  if (slot.approvedBy === undefined || slot.approvedBy.trim() === "") missing.push("approvedBy");
  if (slot.approvedAt === undefined || slot.approvedAt.trim() === "") missing.push("approvedAt");
  if (
    (slot.sourceReference === undefined || slot.sourceReference.trim() === "") &&
    (slot.externalReference === undefined || slot.externalReference.trim() === "")
  ) {
    missing.push("sourceReference oder externalReference");
  }
  return `status "approved", aber es fehlt: ${missing.join(", ")} (§6.9, §12.3).`;
}

/** §13.2 — Policy-Tests. */
export function validatePolicies(dataset: RegulatoryDataset): Violation[] {
  const v: Violation[] = [];
  const auditByTarget = new Map<string, typeof dataset.auditEntries>();
  for (const entry of dataset.auditEntries) {
    const key = `${entry.targetType}:${entry.targetId}`;
    const bucket = auditByTarget.get(key);
    if (bucket) bucket.push(entry);
    else auditByTarget.set(key, [entry]);
  }
  const auditFor = (targetType: string, targetId: string) =>
    auditByTarget.get(`${targetType}:${targetId}`) ?? [];

  // "keine Obligation ohne Quelle" / "kein Rechtsstatus ohne nachvollziehbare Quelle"
  for (const obligation of dataset.obligations) {
    if (obligation.sourceRecords.length === 0) {
      v.push({
        rule: "§13.2",
        targetType: "obligation",
        targetId: obligation.id,
        message: "Obligation ohne Quelle.",
      });
    }
    // "jede Entwurfsmaßnahme erzeugt prepareArchitectureOnly"
    if (
      (obligation.lifecycleState === "draft" || obligation.lifecycleState === "observed") &&
      !obligation.prepareArchitectureOnly
    ) {
      v.push({
        rule: "§13.2/§4.5",
        targetType: "obligation",
        targetId: obligation.id,
        message: `lifecycleState "${obligation.lifecycleState}", aber prepareArchitectureOnly ist false.`,
      });
    }
    // "jede applicable Regulierung erzeugt Evidence-Erfordernis"
    if (obligation.lifecycleState === "applicable" && !obligation.requiresEvidence) {
      v.push({
        rule: "§13.2/§7.2.5",
        targetType: "obligation",
        targetId: obligation.id,
        message: "lifecycleState \"applicable\", aber requiresEvidence ist false.",
      });
    }
  }

  for (const act of dataset.legalActs) {
    if (act.sourceRecords.length === 0) {
      v.push({
        rule: "§13.2/§4.1",
        targetType: "legal_act",
        targetId: act.id,
        message: "Rechtsstatus ohne nachvollziehbare Quelle.",
      });
    }
    // "jede veröffentlichte Regulierung öffnet Content-Update-Fenster":
    // ab `published` muss für jede Pflicht mit requiresLegalText ein Slot da sein.
    if (opensContentWindow(act.lifecycleState)) {
      for (const obligation of dataset.obligations.filter((o) => o.legalActId === act.id)) {
        if (!obligation.requiresLegalText) continue;
        const hasSlot = dataset.legalTextSlots.some((s) => s.obligationId === obligation.id);
        if (!hasSlot) {
          v.push({
            rule: "§13.2/§4.6",
            targetType: "obligation",
            targetId: obligation.id,
            message:
              `Rechtsakt ist ${act.lifecycleState} und die Pflicht verlangt einen Rechtstext, ` +
              "aber es existiert kein LegalTextSlot — das Content-Update-Fenster ist nicht bedienbar.",
          });
        }
      }
    }
  }

  // "keine finale Rechtstextkomponente ohne approved Slot" (Datenseite; die
  // Renderseite prüft §13.5) und die Zusatzinvariante aus F-11.
  for (const slot of dataset.legalTextSlots) {
    const violation = slotReleaseViolation(slot);
    if (violation !== undefined) {
      v.push({ rule: "§13.2/§12.3", targetType: "legal_text_slot", targetId: slot.id, message: violation });
    }
    if (slot.status === "approved" && slot.textSource === "not_set") {
      v.push({
        rule: "§12.1",
        targetType: "legal_text_slot",
        targetId: slot.id,
        message: "Freigegebener Slot ohne Rechtstextquelle (textSource: not_set).",
      });
    }
  }

  // "jede Unsicherheit erzeugt needsLegalReview"
  for (const assessment of dataset.applicabilityAssessments) {
    if (assessment.confidence === "low" && !assessment.needsLegalReview) {
      v.push({
        rule: "§13.2/§8.3",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: "confidence \"low\", aber needsLegalReview ist false.",
      });
    }
    // F-05: jede Änderung eines ApplicabilityAssessment erzeugt einen AuditEntry
    if (auditFor("applicability_assessment", assessment.id).length === 0) {
      v.push({
        rule: "§13.2/§14.1 (F-05)",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: "Kein AuditEntry vorhanden.",
      });
    }
    if (
      assessment.supersededBy !== undefined &&
      !auditFor("applicability_assessment", assessment.id).some((e) => e.action === "update")
    ) {
      v.push({
        rule: "§13.2/§14.1 (F-05)",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: "Ablösung über supersededBy ohne AuditEntry mit action \"update\".",
      });
    }
    if (
      assessment.supersededBy !== undefined &&
      !dataset.applicabilityAssessments.some((a) => a.id === assessment.supersededBy)
    ) {
      v.push({
        rule: "§6.6",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        message: `supersededBy verweist auf ${assessment.supersededBy}, das nicht existiert.`,
      });
    }
  }

  // §6.6: je (legalActId, projectProfileId) darf es höchstens ein gültiges
  // Assessment geben.
  for (const act of dataset.legalActs) {
    for (const profile of dataset.projectProfiles) {
      const open = dataset.applicabilityAssessments.filter(
        (a) =>
          a.legalActId === act.id &&
          a.projectProfileId === profile.id &&
          a.supersededBy === undefined,
      );
      if (open.length > 1) {
        v.push({
          rule: "§6.6",
          targetType: "applicability_assessment",
          targetId: open.map((a) => a.id).join(", "),
          message:
            `${open.length} nicht abgelöste Assessments für (${act.id}, ${profile.id}) — ` +
            "das gültige Assessment ist nicht eindeutig bestimmbar.",
        });
      }
      const current = currentAssessment(dataset.applicabilityAssessments, act.id, profile.id);
      if (current === undefined && open.length === 0) {
        v.push({
          rule: "§8.2",
          targetType: "applicability_assessment",
          targetId: `${act.id}/${profile.id}`,
          message: "Kein gültiges ApplicabilityAssessment für diese Kombination.",
        });
      }
    }
  }

  // F-05: jedes neue SourceRecord erzeugt einen AuditEntry
  for (const record of dataset.sourceRecords) {
    if (auditFor("source_record", record.id).length === 0) {
      v.push({
        rule: "§13.2/§14.1 (F-05)",
        targetType: "source_record",
        targetId: record.id,
        message: "Kein AuditEntry vorhanden.",
      });
    }
  }

  // F-06 / §7.3.2: kein Rechtsakt, der needs_legal_review verlassen hat, ohne
  // dokumentierte Freigabe. Ein Rechtsakt, für den ein Eintritt in
  // needs_legal_review protokolliert ist, der aber nicht mehr dort steht,
  // braucht einen approve-Eintrag eines legal_reviewer.
  for (const act of dataset.legalActs) {
    const entries = auditFor("legal_act", act.id);
    const enteredReview = entries.some(
      (e) => e.action === "update" && (e.reason ?? "").includes("-> needs_legal_review"),
    );
    const approved = entries.some((e) => e.action === "approve" && e.actor === "legal_reviewer");
    if (enteredReview && act.lifecycleState !== "needs_legal_review" && !approved) {
      v.push({
        rule: "§13.2/§7.3.2 (F-06)",
        targetType: "legal_act",
        targetId: act.id,
        message:
          "Rechtsakt hat needs_legal_review verlassen, ohne dass ein AuditEntry mit " +
          "action \"approve\" und actor \"legal_reviewer\" vorliegt.",
      });
    }
  }

  return v;
}

export function validateAll(dataset: RegulatoryDataset): Violation[] {
  return [...validateSchema(dataset), ...validatePolicies(dataset)];
}

export function formatViolations(violations: readonly Violation[]): string {
  if (violations.length === 0) return "Keine Verstöße.";
  return violations
    .map((x) => `- [${x.rule}] ${x.targetType} ${x.targetId}: ${x.message}`)
    .join("\n");
}
