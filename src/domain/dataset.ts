/**
 * Container aller regulatorischen Daten (§15.2 JSON Regulatory Data).
 */
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
} from "./types.js";

export interface RegulatoryDataset {
  legalActs: LegalAct[];
  sourceRecords: SourceRecord[];
  obligations: Obligation[];
  complianceControls: ComplianceControl[];
  implementationTasks: ImplementationTask[];
  legalTextSlots: LegalTextSlot[];
  evidenceArtifacts: EvidenceArtifact[];
  auditEntries: AuditEntry[];
  projectProfiles: ProjectProfile[];
  applicabilityAssessments: ApplicabilityAssessment[];
}

export function emptyDataset(): RegulatoryDataset {
  return {
    legalActs: [],
    sourceRecords: [],
    obligations: [],
    complianceControls: [],
    implementationTasks: [],
    legalTextSlots: [],
    evidenceArtifacts: [],
    auditEntries: [],
    projectProfiles: [],
    applicabilityAssessments: [],
  };
}

export function cloneDataset(dataset: RegulatoryDataset): RegulatoryDataset {
  return structuredClone(dataset);
}

/** Baut einen id → Objekt Index über eine beliebige Entitätsliste. */
export function indexById<T extends { id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function obligationsOfAct(dataset: RegulatoryDataset, legalActId: string): Obligation[] {
  return dataset.obligations.filter((o) => o.legalActId === legalActId);
}

export function controlsOfObligation(
  dataset: RegulatoryDataset,
  obligationId: string,
): ComplianceControl[] {
  return dataset.complianceControls.filter((c) => c.obligationId === obligationId);
}

export function tasksOfControl(
  dataset: RegulatoryDataset,
  complianceControlId: string,
): ImplementationTask[] {
  return dataset.implementationTasks.filter((t) => t.complianceControlId === complianceControlId);
}

export function slotsOfObligation(
  dataset: RegulatoryDataset,
  obligationId: string,
): LegalTextSlot[] {
  return dataset.legalTextSlots.filter((s) => s.obligationId === obligationId);
}

export function evidenceOfObligation(
  dataset: RegulatoryDataset,
  obligationId: string,
  controlIds: readonly string[] = [],
): EvidenceArtifact[] {
  return dataset.evidenceArtifacts.filter(
    (e) =>
      e.obligationId === obligationId ||
      (e.complianceControlId !== undefined && controlIds.includes(e.complianceControlId)),
  );
}

export function findSlotByKey(
  slots: readonly LegalTextSlot[],
  slotKey: string,
): LegalTextSlot | undefined {
  return slots.find((s) => s.slotKey === slotKey);
}
