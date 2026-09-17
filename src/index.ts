/**
 * Öffentliche API des Moduls (SPEC v2).
 *
 * Reihenfolge entspricht der Ausführungsreihenfolge aus §16.
 */

// §6 Domänenmodell
export type {
  ApplicabilityAssessment,
  ApplicabilityLabel,
  AuditEntry,
  AuditTargetType,
  Checklist,
  ChecklistItem,
  ComplianceControl,
  Confidence,
  EvidenceArtifact,
  ImplementationTask,
  LegalAct,
  LegalTextSlot,
  LegalTextSlotStatus,
  Obligation,
  Priority,
  ProjectProfile,
  RoadmapItem,
  SourceRecord,
} from "./domain/types.js";
export { AUDIT_TARGET_TYPES } from "./domain/types.js";
export type { LegalActSlug, KnownSlotKey } from "./domain/slugs.js";
export { LEGAL_ACT_SLUGS, SLOT_KEYS, isLegalActSlug, slotKeyFor } from "./domain/slugs.js";
export type { RegulatoryLifecycleState, ControlImplementationState } from "./domain/lifecycle-states.js";
export {
  CONTROL_IMPLEMENTATION_STATES,
  REGULATORY_LIFECYCLE_STATES,
  isControlImplementationState,
  isDraftStage,
  isInactiveState,
  isRegulatoryLifecycleState,
  opensContentWindow,
} from "./domain/lifecycle-states.js";
export type { RegulatoryDataset } from "./domain/dataset.js";
export {
  cloneDataset,
  controlsOfObligation,
  emptyDataset,
  evidenceOfObligation,
  findSlotByKey,
  indexById,
  obligationsOfAct,
  slotsOfObligation,
  tasksOfControl,
} from "./domain/dataset.js";

// §9.5 Zeit- und Fristenlogik
export type { Clock } from "./time/clock.js";
export {
  REFERENCE_TIME_ZONE,
  daysBetween,
  daysUntil,
  fixedClock,
  isIsoDate,
  isIsoTimestamp,
  isWithinDays,
  systemClock,
  toBerlinDate,
} from "./time/clock.js";

// §7 Zustandsmaschinen
export {
  LegalActTransitionError,
  UNIVERSAL_TARGETS,
  checkLegalActTransition,
  legalActStateRules,
  transitionLegalAct,
} from "./state/legal-act-lifecycle.js";
export {
  CONTROL_PROGRESS_RANK,
  ControlTransitionError,
  checkControlTransition,
  isArchitectureUnprepared,
  leastAdvancedState,
  toChecklistState,
  transitionControl,
} from "./state/control-implementation.js";

// §14 Audit
export { AuditTrail } from "./audit/audit-trail.js";
export type { AuditEvent } from "./audit/audit-trail.js";
export { RegulatoryStore } from "./audit/store.js";
export type { MutationContext } from "./audit/store.js";

// §8 Applicability Engine
export {
  assessAll,
  assessApplicability,
  currentAssessment,
  deriveApplicabilityLabel,
  effectiveApplicabilityForPrioritisation,
} from "./engine/applicability.js";

// §9 Roadmap Engine
export {
  buildRoadmap,
  buildRoadmapResult,
  decidePriority,
  deriveDeadlineHint,
  groupControlsForRoadmap,
  isSlotReleaseCompliant,
} from "./engine/roadmap.js";
export type { PriorityDecision, RoadmapDiagnostics, RoadmapResult } from "./engine/roadmap.js";

// §10 Checklist Generator
export { generateAllChecklists, generateChecklist } from "./engine/checklist.js";

// §13 Schema- und Policy-Prüfungen
export { formatViolations, slotReleaseViolation, validateAll, validatePolicies, validateSchema } from "./policy/validate.js";
export type { Violation } from "./policy/validate.js";

// §11 UI
export { LegalTextRenderer, pendingReasonFor } from "./ui/LegalTextRenderer.js";
export type { LegalTextRendererProps, PendingReason } from "./ui/LegalTextRenderer.js";
export { AccessibilityStatementSlot, AiDisclosureNotice, DataTransparencyNotice } from "./ui/slots.js";
export { ExamplePage } from "./ui/ExamplePage.js";

// §15 Reports
export { renderMarkdownRoadmap } from "./reports/markdown-roadmap.js";
export { buildJsonExport, renderJsonExport } from "./reports/json-export.js";
export type { RegulatoryJsonExport } from "./reports/json-export.js";
export { renderChecklistsMarkdown } from "./reports/checklist-report.js";
export { collectOpenQuestions, renderOpenQuestions } from "./reports/open-questions.js";
export type { OpenQuestion } from "./reports/open-questions.js";

// §16 Seed
export { SEED_CLOCK, SEED_DATE, buildSeedDataset, seedDataset } from "./data/seed.js";
export { DEFAULT_PROFILE_ID, brochureSiteProfile, demoShopProfile, projectProfiles } from "./data/project-profiles.js";
export { SPEC_VERIFICATION_FINDINGS, VERIFICATION_LIMITATION } from "./data/source-verification.js";
export type { VerificationFinding } from "./data/source-verification.js";
export { ACT, CONTROL, OBLIGATION, PROFILE, SLOT } from "./data/ids.js";
