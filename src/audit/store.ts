/**
 * Schreibender Zugriff auf den `RegulatoryDataset` mit erzwungener
 * Audit-Protokollierung (§14.1).
 *
 * Jede Mutation über diesen Store erzeugt genau einen `AuditEntry`. Das deckt
 * insbesondere die von F-05 ergänzten Pflichtereignisse ab:
 * "Erstellung eines SourceRecords" und "Erstellung/Änderung eines
 * ApplicabilityAssessment".
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import { emptyDataset } from "../domain/dataset.js";
import type {
  ApplicabilityAssessment,
  AuditEntry,
  ComplianceControl,
  EvidenceArtifact,
  ImplementationTask,
  LegalAct,
  LegalTextSlot,
  Obligation,
  ProjectProfile,
  SourceRecord,
} from "../domain/types.js";
import type { RegulatoryLifecycleState } from "../domain/lifecycle-states.js";
import { AuditTrail } from "./audit-trail.js";
import type { Clock } from "../time/clock.js";
import { systemClock } from "../time/clock.js";
import { transitionLegalAct } from "../state/legal-act-lifecycle.js";
import { transitionControl } from "../state/control-implementation.js";
import type { ControlImplementationState } from "../domain/lifecycle-states.js";

type Actor = AuditEntry["actor"];

export interface MutationContext {
  actor?: Actor;
  reason?: string;
  sourceReferenceIds?: string[];
}

export class RegulatoryStore {
  readonly #data: RegulatoryDataset;
  readonly #audit: AuditTrail;
  readonly #defaultActor: Actor;

  constructor(
    options: {
      dataset?: RegulatoryDataset;
      clock?: Clock;
      defaultActor?: Actor;
    } = {},
  ) {
    const clock = options.clock ?? systemClock;
    this.#data = options.dataset ?? emptyDataset();
    this.#defaultActor = options.defaultActor ?? "agent";
    this.#audit = new AuditTrail({ clock, entries: this.#data.auditEntries });
    this.#data.auditEntries = [];
  }

  /** Momentaufnahme inkl. aktuellem Audit-Trail. */
  snapshot(): RegulatoryDataset {
    return structuredClone({ ...this.#data, auditEntries: this.#audit.entries() });
  }

  get audit(): AuditTrail {
    return this.#audit;
  }

  #log(
    action: AuditEntry["action"],
    targetType: AuditEntry["targetType"],
    targetId: string,
    ctx: MutationContext,
  ): AuditEntry {
    return this.#audit.record({
      actor: ctx.actor ?? this.#defaultActor,
      action,
      targetType,
      targetId,
      ...(ctx.reason !== undefined ? { reason: ctx.reason } : {}),
      ...(ctx.sourceReferenceIds !== undefined ? { sourceReferenceIds: ctx.sourceReferenceIds } : {}),
    });
  }

  // ---------------------------------------------------------------- create --

  addSourceRecord(record: SourceRecord, ctx: MutationContext = {}): SourceRecord {
    this.#data.sourceRecords.push(record);
    this.#log("create", "source_record", record.id, ctx);
    return record;
  }

  addLegalAct(act: LegalAct, ctx: MutationContext = {}): LegalAct {
    this.#data.legalActs.push(act);
    this.#log("create", "legal_act", act.id, {
      ...ctx,
      sourceReferenceIds: ctx.sourceReferenceIds ?? [...act.sourceRecords],
    });
    return act;
  }

  addObligation(obligation: Obligation, ctx: MutationContext = {}): Obligation {
    this.#data.obligations.push(obligation);
    this.#log("create", "obligation", obligation.id, {
      ...ctx,
      sourceReferenceIds: ctx.sourceReferenceIds ?? [...obligation.sourceRecords],
    });
    return obligation;
  }

  addControl(control: ComplianceControl, ctx: MutationContext = {}): ComplianceControl {
    this.#data.complianceControls.push(control);
    this.#log("create", "control", control.id, ctx);
    return control;
  }

  addTask(task: ImplementationTask, ctx: MutationContext = {}): ImplementationTask {
    this.#data.implementationTasks.push(task);
    this.#log("create", "task", task.id, ctx);
    return task;
  }

  addLegalTextSlot(slot: LegalTextSlot, ctx: MutationContext = {}): LegalTextSlot {
    this.#data.legalTextSlots.push(slot);
    this.#log("create", "legal_text_slot", slot.id, ctx);
    return slot;
  }

  addEvidence(artifact: EvidenceArtifact, ctx: MutationContext = {}): EvidenceArtifact {
    this.#data.evidenceArtifacts.push(artifact);
    this.#log("create", "evidence", artifact.id, ctx);
    return artifact;
  }

  addProjectProfile(profile: ProjectProfile, ctx: MutationContext = {}): ProjectProfile {
    this.#data.projectProfiles.push(profile);
    this.#log("create", "project_profile", profile.id, ctx);
    return profile;
  }

  addApplicabilityAssessment(
    assessment: ApplicabilityAssessment,
    ctx: MutationContext = {},
  ): ApplicabilityAssessment {
    this.#data.applicabilityAssessments.push(assessment);
    this.#log("create", "applicability_assessment", assessment.id, ctx);
    return assessment;
  }

  // ---------------------------------------------------------------- update --

  /**
   * §6.6 Aktualitätsregel (F-13): das Vorgänger-Assessment wird nicht gelöscht,
   * sondern über `supersededBy` auf seinen Nachfolger verwiesen. Beide
   * Schritte sind auditpflichtig (§14.1).
   */
  supersedeAssessment(
    previousId: string,
    next: ApplicabilityAssessment,
    ctx: MutationContext = {},
  ): ApplicabilityAssessment {
    const previous = this.#data.applicabilityAssessments.find((a) => a.id === previousId);
    if (previous === undefined) {
      throw new Error(`ApplicabilityAssessment ${previousId} existiert nicht.`);
    }
    if (previous.supersededBy !== undefined) {
      throw new Error(
        `ApplicabilityAssessment ${previousId} ist bereits durch ${previous.supersededBy} abgelöst.`,
      );
    }
    this.addApplicabilityAssessment(next, ctx);
    previous.supersededBy = next.id;
    this.#log("update", "applicability_assessment", previous.id, {
      ...ctx,
      reason: ctx.reason ?? `Abgelöst durch ${next.id} (§6.6 Aktualitätsregel).`,
    });
    return next;
  }

  /**
   * §7.1–§7.3 — Übergang des Rechtsakt-Lifecycles inkl. Audit.
   * Die Rückkehr aus `needs_legal_review` verlangt eine `legal_reviewer`-
   * Freigabe; der Store erzeugt sie explizit **vor** dem Übergang, damit sie im
   * Trail nachweisbar ist (§7.3.2, §13.2).
   */
  transitionLegalAct(
    legalActId: string,
    to: RegulatoryLifecycleState,
    ctx: MutationContext = {},
  ): LegalAct {
    const index = this.#data.legalActs.findIndex((a) => a.id === legalActId);
    const act = this.#data.legalActs[index];
    if (act === undefined) throw new Error(`LegalAct ${legalActId} existiert nicht.`);

    if (act.lifecycleState === "needs_legal_review") {
      if (ctx.actor !== undefined && ctx.actor !== "legal_reviewer") {
        throw new Error(
          "Die Rückkehr aus needs_legal_review ist ausschließlich durch actor \"legal_reviewer\" zulässig (§7.3.2).",
        );
      }
      const approval = this.#audit.record({
        actor: "legal_reviewer",
        action: "approve",
        targetType: "legal_act",
        targetId: act.id,
        reason: ctx.reason ?? `Freigabe der Rückkehr nach ${to} (§7.3.2).`,
        ...(ctx.sourceReferenceIds !== undefined ? { sourceReferenceIds: ctx.sourceReferenceIds } : {}),
      });
      const updated = transitionLegalAct(act, to, { approval });
      this.#data.legalActs[index] = updated;
      return updated;
    }

    const updated = transitionLegalAct(act, to);
    this.#data.legalActs[index] = updated;
    this.#log("update", "legal_act", act.id, {
      ...ctx,
      reason: ctx.reason ?? `Lifecycle ${act.lifecycleState} -> ${to}.`,
    });
    return updated;
  }

  /** §7.4 — Übergang des Control-Implementierungsstatus inkl. Audit. */
  transitionControl(
    controlId: string,
    to: ControlImplementationState,
    ctx: MutationContext = {},
  ): ComplianceControl {
    const index = this.#data.complianceControls.findIndex((c) => c.id === controlId);
    const control = this.#data.complianceControls[index];
    if (control === undefined) throw new Error(`ComplianceControl ${controlId} existiert nicht.`);
    const updated = transitionControl(control, to);
    this.#data.complianceControls[index] = updated;
    this.#log("update", "control", control.id, {
      ...ctx,
      reason: ctx.reason ?? `Implementierungsstatus ${control.implementationState} -> ${to}.`,
    });
    return updated;
  }

  /**
   * §12.3 — Freigabe eines Rechtstext-Slots. Die Zusatzinvariante aus F-11
   * (`approvedBy`, `approvedAt`, `sourceReference` oder `externalReference`)
   * wird hier erzwungen, damit UI-Code sie nicht umgehen kann.
   */
  approveLegalTextSlot(
    slotId: string,
    approval: {
      approvedBy: string;
      approvedAt: string;
      sourceReference?: string;
      externalReference?: string;
      textSource: Exclude<LegalTextSlot["textSource"], "not_set">;
      version?: string;
    },
    ctx: MutationContext = {},
  ): LegalTextSlot {
    const index = this.#data.legalTextSlots.findIndex((s) => s.id === slotId);
    const slot = this.#data.legalTextSlots[index];
    if (slot === undefined) throw new Error(`LegalTextSlot ${slotId} existiert nicht.`);
    if (approval.sourceReference === undefined && approval.externalReference === undefined) {
      throw new Error(
        "Freigabe erfordert mindestens eines von sourceReference/externalReference (§6.9, §12.3).",
      );
    }
    const updated: LegalTextSlot = {
      ...slot,
      status: "approved",
      textSource: approval.textSource,
      approvedBy: approval.approvedBy,
      approvedAt: approval.approvedAt,
      updatedAt: approval.approvedAt,
      updatedBy: approval.approvedBy,
      ...(approval.sourceReference !== undefined ? { sourceReference: approval.sourceReference } : {}),
      ...(approval.externalReference !== undefined
        ? { externalReference: approval.externalReference }
        : {}),
      ...(approval.version !== undefined ? { version: approval.version } : {}),
    };
    this.#data.legalTextSlots[index] = updated;
    this.#audit.record({
      actor: ctx.actor ?? "legal_reviewer",
      action: "approve",
      targetType: "legal_text_slot",
      targetId: slot.id,
      reason: ctx.reason ?? `Rechtstext freigegeben durch ${approval.approvedBy}.`,
      ...(ctx.sourceReferenceIds !== undefined ? { sourceReferenceIds: ctx.sourceReferenceIds } : {}),
    });
    return updated;
  }

  /** Generische Protokollierung für Review/Reject/Escalation (§14.1). */
  log(event: {
    actor: Actor;
    action: AuditEntry["action"];
    targetType: AuditEntry["targetType"];
    targetId: string;
    reason?: string;
    sourceReferenceIds?: string[];
  }): AuditEntry {
    return this.#audit.record(event);
  }
}
