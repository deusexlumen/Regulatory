/**
 * SPEC v2 §9 — Roadmap-Engine.
 *
 * Erzeugt aus Rechtsakt, Projektprofil, gültigem ApplicabilityAssessment,
 * Pflichten, Kontrollen, Implementierungsstatus, Fristen und Unsicherheiten
 * eine priorisierte Umsetzungsroadmap.
 *
 * Die Engine ist deterministisch: gleiche Eingabe + gleicher Clock ergeben
 * exakt die gleiche Ausgabe.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import {
  controlsOfObligation,
  evidenceOfObligation,
  obligationsOfAct,
  slotsOfObligation,
  tasksOfControl,
} from "../domain/dataset.js";
import { isDraftStage, isInactiveState, opensContentWindow } from "../domain/lifecycle-states.js";
import type { ControlImplementationState } from "../domain/lifecycle-states.js";
import type {
  ApplicabilityAssessment,
  ApplicabilityLabel,
  ComplianceControl,
  LegalAct,
  LegalTextSlot,
  Obligation,
  Priority,
  RoadmapItem,
} from "../domain/types.js";
import { isArchitectureUnprepared, leastAdvancedState } from "../state/control-implementation.js";
import type { Clock } from "../time/clock.js";
import { isWithinDays, systemClock } from "../time/clock.js";
import {
  currentAssessment,
  deriveApplicabilityLabel,
  effectiveApplicabilityForPrioritisation,
} from "./applicability.js";

/**
 * §6.9 / §12.3 Zusatzinvariante (F-11): ein Slot gilt nur dann als freigegeben,
 * wenn neben `status === "approved"` auch `approvedBy`, `approvedAt` und
 * mindestens eine Referenz gesetzt sind.
 */
export function isSlotReleaseCompliant(slot: LegalTextSlot): boolean {
  if (slot.status !== "approved") return false;
  const hasApprover = typeof slot.approvedBy === "string" && slot.approvedBy.trim() !== "";
  const hasApprovedAt = typeof slot.approvedAt === "string" && slot.approvedAt.trim() !== "";
  const hasReference =
    (typeof slot.sourceReference === "string" && slot.sourceReference.trim() !== "") ||
    (typeof slot.externalReference === "string" && slot.externalReference.trim() !== "");
  return hasApprover && hasApprovedAt && hasReference;
}

/**
 * §9.5.3 — Ableitung des `deadlineHint` aus dem Rechtsakt.
 * Priorität: `transitionEnd` → `applicableDate` → `effectiveDate`.
 *
 * §9.4.1 (Interpretation IN-03): In den Entwurfsstadien `observed`/`draft`
 * gelten die Datumsangaben nicht als bestätigt. Es wird daher keine Frist
 * behauptet, statt eine vorläufige Zahl zu übernehmen.
 */
export function deriveDeadlineHint(act: LegalAct): string | undefined {
  if (isDraftStage(act.lifecycleState)) return undefined;
  return act.transitionEnd ?? act.applicableDate ?? act.effectiveDate;
}

interface PriorityInput {
  effectiveApplicability: ApplicabilityLabel;
  deadlineHint: string | undefined;
  worstControlState: ControlImplementationState | undefined;
  obligation: Obligation;
  hasApprovedSlot: boolean;
  hasApprovedEvidence: boolean;
  legalReviewRequired: boolean;
  lifecycleState: LegalAct["lifecycleState"];
  clock: Clock;
}

export interface PriorityDecision {
  priority: Priority;
  /** Nummer der greifenden Regel aus §9.3, `4` = Default `low`. */
  rule: 1 | 2 | 3 | 4;
  explanation: string;
}

/**
 * SPEC v2 §9.3 — geordnete Entscheidungsliste (F-08, F-12).
 * Die erste zutreffende Regel bestimmt die Priorität; nachfolgende Regeln
 * werden nicht mehr geprüft.
 */
export function decidePriority(input: PriorityInput): PriorityDecision {
  const {
    effectiveApplicability,
    deadlineHint,
    worstControlState,
    obligation,
    hasApprovedSlot,
    hasApprovedEvidence,
    legalReviewRequired,
    lifecycleState,
    clock,
  } = input;

  // Vorbedingung für alle Stufen außer `low` (§9.3).
  const preconditionMet =
    effectiveApplicability === "applicable" || effectiveApplicability === "possibly_applicable";
  if (!preconditionMet) {
    return {
      priority: "low",
      rule: 4,
      explanation:
        "Vorbedingung aus §9.3 nicht erfüllt: die zugrunde liegende Bewertung trägt keine Anwendbarkeit.",
    };
  }

  const notImplemented = worstControlState !== "implemented";
  const legalTextGap = obligation.requiresLegalText && !hasApprovedSlot;
  const evidenceGap = obligation.requiresEvidence && !hasApprovedEvidence;

  // ---- Regel 1: critical ------------------------------------------------
  // Guard (F-12): ohne requiresLegalText und ohne requiresEvidence kann diese
  // Regel nie "critical" ergeben — es wird direkt Regel 2 geprüft.
  const guardSatisfied = obligation.requiresLegalText || obligation.requiresEvidence;
  if (guardSatisfied && isWithinDays(deadlineHint, 90, clock) && notImplemented && (legalTextGap || evidenceGap)) {
    return {
      priority: "critical",
      rule: 1,
      explanation:
        `Frist ${deadlineHint} liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen ` +
        `und eine tatsächlich verlangte Bedingung ist offen (` +
        `${[legalTextGap ? "Rechtstext nicht freigegeben" : null, evidenceGap ? "Nachweis nicht freigegeben" : null]
          .filter((x): x is string => x !== null)
          .join(", ")}).`,
    };
  }

  // ---- Regel 2: high ----------------------------------------------------
  // §9.5.4: ohne gesetzten `deadlineHint` kann Regel 2 über ihre übrigen
  // Bedingungen dennoch greifen — allerdings nicht im Entwurfsstadium, wo
  // §9.4.4 ausschließlich Architekturvorbereitung zulässt (IN-04).
  const deadlineGateOpen =
    deadlineHint === undefined ? !isDraftStage(lifecycleState) : isWithinDays(deadlineHint, 180, clock);
  const architectureUnprepared = isArchitectureUnprepared(worstControlState);
  if (deadlineGateOpen && (architectureUnprepared || legalTextGap || legalReviewRequired)) {
    const reasons = [
      architectureUnprepared ? `Architektur nicht vorbereitet (Control-Status: ${worstControlState ?? "keine Kontrolle"})` : null,
      legalTextGap ? "Rechtstext nicht finalisiert" : null,
      legalReviewRequired ? "rechtliche Prüfung erforderlich" : null,
    ].filter((x): x is string => x !== null);
    return {
      priority: "high",
      rule: 2,
      explanation:
        (deadlineHint !== undefined
          ? `Frist ${deadlineHint} liegt weniger als 180 Tage in der Zukunft; `
          : "Keine bestätigte Frist bekannt (§9.5.4); ") + reasons.join(", ") + ".",
    };
  }

  // ---- Regel 3: medium --------------------------------------------------
  const publicationForeseeable = lifecycleState === "adopted" || lifecycleState === "published";
  const preparationSensible = notImplemented && !isInactiveState(lifecycleState);
  if (publicationForeseeable && preparationSensible) {
    return {
      priority: "medium",
      rule: 3,
      explanation:
        `Veröffentlichung absehbar (lifecycleState: ${lifecycleState}), technische Vorbereitung sinnvoll und ` +
        "möglich, keine unmittelbare Pflichtaktivierung.",
    };
  }

  // ---- Regel 4: low (Default) ------------------------------------------
  return {
    priority: "low",
    rule: 4,
    explanation: "Monitoring: keine unmittelbare technische Auswirkung erkennbar.",
  };
}

/**
 * §9.6 — Gruppierung der Kontrollen einer Obligation.
 *
 * Standard: **ein** RoadmapItem je Obligation. Aufgesplittet wird nur, wenn
 * Kontrollen erkennbar unterschiedliche Verantwortlichkeiten (`ownerRole`)
 * oder unterschiedliche Fristen (frühester `dueHint` ihrer Tasks) haben.
 */
export function groupControlsForRoadmap(
  dataset: RegulatoryDataset,
  controls: readonly ComplianceControl[],
): ComplianceControl[][] {
  if (controls.length <= 1) return [[...controls]];

  const groups = new Map<string, ComplianceControl[]>();
  for (const control of controls) {
    const dues = tasksOfControl(dataset, control.id)
      .map((t) => t.dueHint)
      .filter((d): d is string => d !== undefined)
      .sort();
    const key = `${control.ownerRole ?? "*"}|${dues[0] ?? "*"}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(control);
    else groups.set(key, [control]);
  }
  return groups.size === 1 ? [[...controls]] : [...groups.values()];
}

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export interface RoadmapOptions {
  clock?: Clock;
}

/** Zusatzinformationen je Item — nicht Teil von §9.2, nur für Reports/Tests. */
export interface RoadmapDiagnostics {
  itemId: string;
  priorityRule: PriorityDecision["rule"];
  priorityExplanation: string;
  worstControlState: ControlImplementationState | undefined;
  assessmentId: string;
}

export interface RoadmapResult {
  items: RoadmapItem[];
  diagnostics: RoadmapDiagnostics[];
}

function buildItem(
  dataset: RegulatoryDataset,
  act: LegalAct,
  obligation: Obligation,
  controls: readonly ComplianceControl[],
  assessment: ApplicabilityAssessment,
  label: ApplicabilityLabel,
  clock: Clock,
): { item: RoadmapItem; diagnostics: RoadmapDiagnostics } {
  const slots = slotsOfObligation(dataset, obligation.id);
  const controlIds = controls.map((c) => c.id);
  const evidence = evidenceOfObligation(dataset, obligation.id, controlIds);

  const hasApprovedSlot = slots.some(isSlotReleaseCompliant);
  const hasApprovedEvidence = evidence.some((e) => e.status === "approved");
  const worstControlState = leastAdvancedState(controls);
  const deadlineHint = deriveDeadlineHint(act);

  const legalReviewRequired =
    obligation.needsLegalReview ||
    assessment.needsLegalReview ||
    label === "needs_legal_review" ||
    act.lifecycleState === "needs_legal_review";

  const contentWindowOpen = opensContentWindow(act.lifecycleState);
  const inactive = isInactiveState(act.lifecycleState);

  // §4.6 / §7.2.3: ein Rechtstext-Update darf erst gefordert werden, wenn der
  // Rechtsakt veröffentlicht ist.
  const legalTextUpdateRequired =
    obligation.requiresLegalText && !hasApprovedSlot && contentWindowOpen && !inactive;

  // §4.5 / §9.4.4: im Entwurfsstadium ist Architekturvorbereitung die einzige
  // zulässige Empfehlung; sonst hängt sie am Umsetzungsstand.
  const architecturePreparationRequired =
    !inactive &&
    (obligation.prepareArchitectureOnly ||
      isDraftStage(act.lifecycleState) ||
      isArchitectureUnprepared(worstControlState));

  const decision = decidePriority({
    effectiveApplicability: effectiveApplicabilityForPrioritisation(assessment),
    deadlineHint,
    worstControlState,
    obligation,
    hasApprovedSlot,
    hasApprovedEvidence,
    legalReviewRequired,
    lifecycleState: act.lifecycleState,
    clock,
  });

  const blockers: string[] = [];
  if (act.lifecycleState === "blocked") {
    blockers.push(`Rechtsakt ${act.slug} ist blockiert — weitere Umsetzung ausgesetzt (§7.2.6).`);
  }
  if (act.lifecycleState === "needs_legal_review") {
    blockers.push(`Rechtsakt ${act.slug} steht in needs_legal_review — finale Inhalte blockiert (§7.2.1).`);
  }
  for (const control of controls) {
    if (control.implementationState === "blocked") {
      blockers.push(`Kontrolle ${control.id} ("${control.title}") ist blockiert (§7.4).`);
    }
  }
  if (legalReviewRequired && act.lifecycleState !== "needs_legal_review") {
    blockers.push("Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).");
  }
  if (obligation.requiresLegalText && !hasApprovedSlot) {
    const keys = slots.map((s) => s.slotKey).join(", ");
    blockers.push(
      slots.length === 0
        ? `Kein LegalTextSlot für Pflicht ${obligation.id} angelegt, obwohl requiresLegalText gesetzt ist.`
        : `Rechtstext-Slot nicht freigabekonform: ${keys} (§12.3).`,
    );
  }
  if (obligation.requiresEvidence && !hasApprovedEvidence) {
    blockers.push(`Nachweis für Pflicht ${obligation.id} liegt nicht freigegeben vor (§4.7, §7.2.5).`);
  }
  if (act.sourceRecords.length === 0) {
    blockers.push(`Rechtsakt ${act.slug} ohne Quelle — nicht releasefähig (§4.1).`);
  }
  if (deadlineHint === undefined) {
    blockers.push("Keine bestätigte Frist ableitbar — es wird keine Frist behauptet (§9.4.1, §9.5.4).");
  }

  const dependencies: string[] = [];
  for (const control of controls) {
    dependencies.push(`control:${control.id}`);
    if (control.dependsOnPublication) dependencies.push(`legal_act:${act.id}:published`);
    if (control.dependsOnLegalText) {
      for (const slot of slots) dependencies.push(`legal_text_slot:${slot.id}`);
    }
  }

  const recommendedAction = recommendAction({
    act,
    obligation,
    controls,
    slots,
    legalReviewRequired,
    legalTextUpdateRequired,
    architecturePreparationRequired,
    worstControlState,
    hasApprovedEvidence,
    inactive,
  });

  // F-14: Ein Item, das genau eine Kontrolle abbildet, referenziert sie direkt.
  // Ein zusammengefasstes Item lässt `complianceControlId` bewusst leer — es
  // steht für mehrere Kontrollen und wird über "ungünstigster Zustand gewinnt"
  // berechnet (§9.6).
  const singleControl = controls.length === 1 ? controls[0] : undefined;
  const id = singleControl
    ? `rm-${assessment.projectProfileId}-${obligation.id}-${singleControl.id}`
    : `rm-${assessment.projectProfileId}-${obligation.id}`;

  const item: RoadmapItem = {
    id,
    legalActId: act.id,
    obligationId: obligation.id,
    ...(singleControl !== undefined ? { complianceControlId: singleControl.id } : {}),
    projectProfileId: assessment.projectProfileId,
    applicability: label,
    lifecycleState: act.lifecycleState,
    priority: decision.priority,
    recommendedAction,
    architecturePreparationRequired,
    legalTextUpdateRequired,
    legalReviewRequired,
    ...(deadlineHint !== undefined ? { deadlineHint } : {}),
    dependencies: [...new Set(dependencies)],
    blockers,
  };

  return {
    item,
    diagnostics: {
      itemId: id,
      priorityRule: decision.rule,
      priorityExplanation: decision.explanation,
      worstControlState,
      assessmentId: assessment.id,
    },
  };
}

function recommendAction(input: {
  act: LegalAct;
  obligation: Obligation;
  controls: readonly ComplianceControl[];
  slots: readonly LegalTextSlot[];
  legalReviewRequired: boolean;
  legalTextUpdateRequired: boolean;
  architecturePreparationRequired: boolean;
  worstControlState: ControlImplementationState | undefined;
  hasApprovedEvidence: boolean;
  inactive: boolean;
}): string {
  const {
    act,
    obligation,
    slots,
    legalReviewRequired,
    legalTextUpdateRequired,
    worstControlState,
    hasApprovedEvidence,
    inactive,
  } = input;

  if (inactive) {
    return `Umsetzung ausgesetzt: Rechtsakt ist ${act.lifecycleState}. Bestehende Aufgaben nicht weiterführen (§7.2.6/§7.2.7).`;
  }
  if (legalReviewRequired) {
    return (
      "Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. " +
      "Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3)."
    );
  }
  if (isDraftStage(act.lifecycleState)) {
    return (
      "Nur Architekturvorbereitung: Komponenten, Slots, Konfiguration und Prüflogik anlegen. " +
      "Keine finalen Inhalte, keine Fristenbehauptung (§4.5, §9.4.4)."
    );
  }
  if (legalTextUpdateRequired) {
    const keys = slots.map((s) => s.slotKey).join(", ") || "(Slot fehlt, anlegen)";
    return (
      `Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot ${keys} ` +
      "bleibt bis zur Freigabe Platzhalter (§12.1–§12.4)."
    );
  }
  if (worstControlState !== undefined && worstControlState !== "implemented") {
    return `Umsetzung fortführen; ungünstigster Control-Status ist "${worstControlState}" (§9.6).`;
  }
  if (obligation.requiresEvidence && !hasApprovedEvidence) {
    return "Nachweis erzeugen, prüfen und freigeben (EvidenceArtifact), damit die Pflicht belegbar ist (§4.7, §14.3).";
  }
  return "Monitoring: Quelle und Fristen beobachten, keine unmittelbare technische Auswirkung erkennbar.";
}

/**
 * Baut die Roadmap für ein Projektprofil.
 *
 * §8.3 Regel 6: Für `not_applicable` bewertete Rechtsakte werden **keine**
 * RoadmapItems erzeugt.
 */
export function buildRoadmapResult(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: RoadmapOptions = {},
): RoadmapResult {
  const clock = options.clock ?? systemClock;
  const profileExists = dataset.projectProfiles.some((p) => p.id === projectProfileId);
  if (!profileExists) {
    throw new Error(`ProjectProfile ${projectProfileId} existiert nicht.`);
  }

  const items: RoadmapItem[] = [];
  const diagnostics: RoadmapDiagnostics[] = [];

  for (const act of dataset.legalActs) {
    const assessment = currentAssessment(
      dataset.applicabilityAssessments,
      act.id,
      projectProfileId,
    );
    if (assessment === undefined) continue;

    const label = deriveApplicabilityLabel(assessment);
    if (label === "not_applicable") continue;

    for (const obligation of obligationsOfAct(dataset, act.id)) {
      const controls = controlsOfObligation(dataset, obligation.id);
      const groups = groupControlsForRoadmap(dataset, controls);
      for (const group of groups) {
        const built = buildItem(dataset, act, obligation, group, assessment, label, clock);
        items.push(built.item);
        diagnostics.push(built.diagnostics);
      }
    }
  }

  items.sort((a, b) => {
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (byPriority !== 0) return byPriority;
    const aDeadline = a.deadlineHint ?? "9999-12-31";
    const bDeadline = b.deadlineHint ?? "9999-12-31";
    if (aDeadline !== bDeadline) return aDeadline < bDeadline ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const order = new Map(items.map((item, index) => [item.id, index]));
  diagnostics.sort((a, b) => (order.get(a.itemId) ?? 0) - (order.get(b.itemId) ?? 0));

  return { items, diagnostics };
}

export function buildRoadmap(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: RoadmapOptions = {},
): RoadmapItem[] {
  return buildRoadmapResult(dataset, projectProfileId, options).items;
}
