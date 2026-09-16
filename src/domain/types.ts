/**
 * SPEC v2 §6 — Domänenmodell.
 *
 * Die Interfaces entsprechen 1:1 der Spezifikation. Abweichungen oder
 * Ergänzungen sind am jeweiligen Feld kommentiert.
 *
 * Alle Datumsfelder sind ISO-8601-Datumsangaben `YYYY-MM-DD` ohne Uhrzeit
 * (§9.5.1). Reine Zeitstempel (`AuditEntry.timestamp`, `retrievedAt`,
 * `assessedAt`, `createdAt`, `approvedAt`, `updatedAt`) dürfen zusätzlich eine
 * Uhrzeitkomponente tragen, siehe `src/time/clock.ts`.
 */
import type { LegalActSlug } from "./slugs.js";
import type { ControlImplementationState, RegulatoryLifecycleState } from "./lifecycle-states.js";

export type Confidence = "high" | "medium" | "low";

/** SPEC v2 §6.2 */
export interface SourceRecord {
  id: string;
  sourceSystem: "DIP" | "EUR-Lex" | "BGBl" | "DSK" | "Manual";
  documentType:
    | "bill"
    | "directive"
    | "regulation"
    | "guidance"
    | "announcement"
    | "official_publication"
    | "interpretation_aid";
  officialIdentifier?: string;
  title?: string;
  url?: string;
  publicationDate?: string;
  retrievedAt: string;
  confidence: Confidence;
  notes?: string;
}

/** SPEC v2 §6.3 */
export interface LegalAct {
  id: string;
  /** F-02: kanonische Referenz statt freier Strings. */
  slug: LegalActSlug;
  name: string;
  shortName?: string;
  jurisdiction: "EU" | "DE" | "EU+DE";
  legalBasis?: string;
  sourceRecords: string[];
  lifecycleState: RegulatoryLifecycleState;
  /** F-06: gespeicherter Zustand vor Eintritt in `needs_legal_review` (§7.3). */
  preReviewState?: RegulatoryLifecycleState;
  effectiveDate?: string;
  applicableDate?: string;
  transitionPeriod?: string;
  transitionEnd?: string;
  reviewStatus: "draft" | "needs_legal_review" | "approved";
  summary?: string;
}

/** SPEC v2 §6.5 */
export interface ProjectProfile {
  id: string;
  name: string;
  jurisdiction: "DE" | "EU" | "DE+EU";
  isECommerce: boolean;
  hasUserAccounts: boolean;
  hasAiChatbot: boolean;
  hasAiGeneratedContent: boolean;
  hasAutomatedDecisions: boolean;
  hasIotConnection: boolean;
  hasUserGeneratedData: boolean;
  hasThirdPartyDataSharing: boolean;
  hasAnalytics: boolean;
  hasNewsletter: boolean;
  hasPayment: boolean;
  hasMarketplaceFeatures: boolean;
  hasAccessibilityRelevantService: boolean;
  accessibilityRelevance: "high" | "medium" | "low" | "unknown";
}

/** SPEC v2 §6.6 */
export interface ApplicabilityAssessment {
  id: string;
  legalActId: string;
  projectProfileId: string;
  applicable: boolean;
  confidence: Confidence;
  reasons: string[];
  needsLegalReview: boolean;
  assessedAt: string;
  /** F-16 */
  reviewedBy?: string;
  /** F-16 */
  reviewedAt?: string;
  /** F-13: id des nachfolgenden Assessments (§6.6, Aktualitätsregel). */
  supersededBy?: string;
}

/** SPEC v2 §6.7 */
export interface ComplianceControl {
  id: string;
  obligationId: string;
  title: string;
  controlType:
    | "ui_component"
    | "configuration"
    | "policy"
    | "workflow"
    | "test"
    | "documentation"
    | "accessibility_structure"
    | "disclosure_notice"
    | "data_transparency"
    | "audit_log";
  targetModule?: string;
  /** §7.4 — eigene Zustandsmaschine, nie `RegulatoryLifecycleState`. */
  implementationState: ControlImplementationState;
  dependsOnPublication: boolean;
  dependsOnLegalText: boolean;
  ownerRole?: string;
  notes?: string;
}

/** SPEC v2 §6.8 */
export interface ImplementationTask {
  id: string;
  complianceControlId: string;
  title: string;
  priority: Priority;
  state:
    | "monitor"
    | "prepare_architecture"
    | "await_publication"
    | "update_legal_text"
    | "implement"
    | "test"
    | "review"
    /** F-07 */
    | "blocked"
    | "done";
  dueHint?: string;
  legalSourceIds: string[];
  needsLegalReview: boolean;
  outputArtifacts?: string[];
}

/** SPEC v2 §6.9 */
export interface LegalTextSlot {
  id: string;
  obligationId: string;
  /** Konvention `"<slug_lowercase>.<zweck>"` (§11.1). */
  slotKey: string;
  placement?: "footer" | "banner" | "settings" | "onboarding" | "chat" | "contextual";
  textSource: "generator" | "law_firm" | "official" | "internal_review" | "not_set";
  status: LegalTextSlotStatus;
  approvedBy?: string;
  approvedAt?: string;
  externalReference?: string;
  sourceReference?: string;
  version?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type LegalTextSlotStatus = "empty" | "draft" | "needs_review" | "approved";

/** SPEC v2 §6.10 */
export interface EvidenceArtifact {
  id: string;
  obligationId?: string;
  complianceControlId?: string;
  type:
    | "screenshot"
    | "audit_report"
    | "accessibility_report"
    | "legal_approval"
    | "generator_export"
    | "test_result"
    | "changelog"
    | "process_documentation";
  reference?: string;
  createdAt: string;
  createdBy?: string;
  status: "collected" | "reviewed" | "approved" | "rejected";
}

/** SPEC v2 §6.11 */
export interface Obligation {
  id: string;
  legalActId: string;
  title: string;
  description?: string;
  normReference?: string;
  sourceRecords: string[];
  affectedLayers: Array<"frontend" | "backend" | "content" | "legal" | "operations" | "data">;
  lifecycleState: RegulatoryLifecycleState;
  actionableNow: boolean;
  prepareArchitectureOnly: boolean;
  requiresLegalText: boolean;
  requiresEvidence: boolean;
  needsLegalReview: boolean;
}

/** SPEC v2 §6.12 */
export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: "agent" | "developer" | "legal_reviewer" | "system";
  action: "create" | "update" | "review" | "approve" | "reject" | "escalate";
  targetType: AuditTargetType;
  targetId: string;
  reason?: string;
  sourceReferenceIds?: string[];
}

/** F-05: `source_record` und `applicability_assessment` ergänzt. */
export type AuditTargetType =
  | "legal_act"
  | "source_record"
  | "applicability_assessment"
  | "obligation"
  | "control"
  | "task"
  | "legal_text_slot"
  | "evidence"
  | "project_profile";

export const AUDIT_TARGET_TYPES = [
  "legal_act",
  "source_record",
  "applicability_assessment",
  "obligation",
  "control",
  "task",
  "legal_text_slot",
  "evidence",
  "project_profile",
] as const satisfies readonly AuditTargetType[];

export type Priority = "critical" | "high" | "medium" | "low";

/** SPEC v2 §9.2 */
export interface RoadmapItem {
  id: string;
  legalActId: string;
  obligationId?: string;
  /** F-14: gesetzt, wenn das Item genau eine Kontrolle abbildet (§9.6). */
  complianceControlId?: string;
  projectProfileId: string;
  /** Ableitung ausschließlich über §8.4. */
  applicability: ApplicabilityLabel;
  lifecycleState: RegulatoryLifecycleState;
  priority: Priority;
  recommendedAction: string;
  architecturePreparationRequired: boolean;
  legalTextUpdateRequired: boolean;
  legalReviewRequired: boolean;
  /** ISO 8601 `YYYY-MM-DD`, abgeleitet gemäß §9.5. */
  deadlineHint?: string;
  dependencies: string[];
  blockers: string[];
}

export type ApplicabilityLabel =
  | "applicable"
  | "possibly_applicable"
  | "not_applicable"
  | "needs_legal_review";

/** SPEC v2 §10.2 */
export interface ChecklistItem {
  id: string;
  checklistId: string;
  /** `LegalAct.id` — nicht der Slug, weil hier die referenzierte Instanz gemeint ist. */
  regulationId: string;
  projectProfileId?: string;
  title: string;
  description?: string;
  category:
    | "accessibility"
    | "ai_transparency"
    | "data_transparency"
    | "content"
    | "legal_review"
    | "testing"
    | "documentation"
    | "architecture";
  state: "not_started" | "prepared" | "in_progress" | "needs_review" | "done" | "blocked";
  requiresLegalText: boolean;
  requiresEvidence: boolean;
  needsLegalReview: boolean;
}

/**
 * Container für eine Checkliste. `skippedReason` ist gesetzt, wenn für das
 * Profil keine Anwendbarkeit besteht und daher gemäß §8.3 Regel 6 keine
 * Pflichtpunkte erzeugt wurden.
 */
export interface Checklist {
  id: string;
  legalActId: string;
  legalActSlug: LegalActSlug;
  projectProfileId: string;
  title: string;
  items: ChecklistItem[];
  skippedReason?: string;
}
