/**
 * SPEC v2 §7.1–§7.3 — Rechtsakt-Lifecycle (`LegalAct.lifecycleState`).
 *
 * Diese Maschine gilt ausschließlich für Rechtsakte. Sie kennt weder
 * `implemented` noch `needs_review` — beides gehört zur Control-Maschine
 * (`src/state/control-implementation.ts`, §7.4).
 */
import type { RegulatoryLifecycleState } from "../domain/lifecycle-states.js";
import type { AuditEntry, LegalAct } from "../domain/types.js";

/** Lineare Reifekette aus §7.1.2. */
const LINEAR_TRANSITIONS: Readonly<Record<RegulatoryLifecycleState, readonly RegulatoryLifecycleState[]>> = {
  observed: ["draft"],
  draft: ["adopted"],
  adopted: ["published"],
  published: ["in_force"],
  in_force: ["transition_period"],
  transition_period: ["applicable"],
  applicable: [],
  superseded: [],
  repealed: [],
  needs_legal_review: [],
  blocked: [],
};

/** `any -> …` Übergänge aus §7.1.2. */
export const UNIVERSAL_TARGETS: readonly RegulatoryLifecycleState[] = [
  "superseded",
  "repealed",
  "blocked",
  "needs_legal_review",
];

export interface TransitionCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Prüft einen Übergang der Rechtsakt-Maschine.
 *
 * Der Ausgang aus `needs_legal_review` ist ausschließlich die Rückkehr in
 * `preReviewState` (§7.3) und wird hier nur strukturell geprüft; die
 * Freigabepflicht (AuditEntry) erzwingt `transitionLegalAct`.
 */
export function checkLegalActTransition(
  act: Pick<LegalAct, "lifecycleState" | "preReviewState">,
  to: RegulatoryLifecycleState,
): TransitionCheck {
  const from = act.lifecycleState;

  if (from === to) {
    return { allowed: false, reason: `Selbstübergang ${from} -> ${to} ist nicht definiert.` };
  }

  if (from === "needs_legal_review") {
    if (act.preReviewState === undefined) {
      return {
        allowed: false,
        reason:
          "Rechtsakt steht in needs_legal_review ohne preReviewState — der Ausgang ist nicht bestimmbar (§7.3.1).",
      };
    }
    if (to !== act.preReviewState) {
      return {
        allowed: false,
        reason: `Aus needs_legal_review ist nur die Rückkehr nach ${act.preReviewState} zulässig (§7.3.2), nicht nach ${to}.`,
      };
    }
    return { allowed: true };
  }

  if (UNIVERSAL_TARGETS.includes(to)) {
    return { allowed: true };
  }

  if ((LINEAR_TRANSITIONS[from] ?? []).includes(to)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Übergang ${from} -> ${to} ist in der Rechtsakt-Maschine nicht definiert (§7.1.2).`,
  };
}

export class LegalActTransitionError extends Error {
  constructor(
    message: string,
    readonly from: RegulatoryLifecycleState,
    readonly to: RegulatoryLifecycleState,
  ) {
    super(message);
    this.name = "LegalActTransitionError";
  }
}

export interface LegalActTransitionOptions {
  /**
   * Beim Verlassen von `needs_legal_review` zwingend erforderlich: ein
   * AuditEntry mit `action: "approve"` und `actor: "legal_reviewer"` (§7.3.2).
   */
  approval?: AuditEntry;
}

/**
 * Führt einen Übergang aus und gibt eine **neue** `LegalAct`-Instanz zurück.
 *
 * - Eintritt in `needs_legal_review` speichert den bisherigen Zustand in
 *   `preReviewState` (§7.3.1).
 * - Austritt ist nur die Rückkehr in `preReviewState`, ausgelöst durch eine
 *   dokumentierte Freigabe (§7.3.2); `preReviewState` wird geleert (§7.3.3).
 */
export function transitionLegalAct(
  act: LegalAct,
  to: RegulatoryLifecycleState,
  options: LegalActTransitionOptions = {},
): LegalAct {
  const check = checkLegalActTransition(act, to);
  if (!check.allowed) {
    throw new LegalActTransitionError(check.reason ?? "Unzulässiger Übergang.", act.lifecycleState, to);
  }

  if (act.lifecycleState === "needs_legal_review") {
    const approval = options.approval;
    if (
      approval === undefined ||
      approval.action !== "approve" ||
      approval.actor !== "legal_reviewer" ||
      approval.targetType !== "legal_act" ||
      approval.targetId !== act.id
    ) {
      throw new LegalActTransitionError(
        "Rückkehr aus needs_legal_review erfordert einen AuditEntry mit action:\"approve\", " +
          "actor:\"legal_reviewer\" und targetType:\"legal_act\" für genau diesen Rechtsakt (§7.3.2).",
        act.lifecycleState,
        to,
      );
    }
    const { preReviewState: _dropped, ...rest } = act;
    return { ...rest, lifecycleState: to };
  }

  if (to === "needs_legal_review") {
    return { ...act, lifecycleState: to, preReviewState: act.lifecycleState };
  }

  return { ...act, lifecycleState: to };
}

/**
 * SPEC v2 §7.2 — Zustandsregeln als auswertbare Aussagen.
 * Reine Funktionen ohne Seiteneffekt; die Engines lesen sie, statt die Regeln
 * an mehreren Stellen nachzubauen.
 */
export const legalActStateRules = {
  /** 7.2.1 — blockiert finale Inhalte, solange aktiv. */
  blocksFinalContent: (state: RegulatoryLifecycleState): boolean => state === "needs_legal_review",
  /** 7.2.2 — `draft` erlaubt nur Architekturvorbereitung. */
  architecturePreparationOnly: (state: RegulatoryLifecycleState): boolean =>
    state === "observed" || state === "draft",
  /** 7.2.3 — `published` öffnet das Rechtstext-Aktualisierungsfenster. */
  opensContentUpdateWindow: (state: RegulatoryLifecycleState): boolean =>
    state === "published" || state === "in_force" || state === "transition_period" || state === "applicable",
  /** 7.2.4 — `transition_period` erzeugt Umsetzungspriorität. */
  createsImplementationPriority: (state: RegulatoryLifecycleState): boolean =>
    state === "transition_period",
  /** 7.2.5 — `applicable` erzeugt Nachweiserfordernis. */
  requiresEvidence: (state: RegulatoryLifecycleState): boolean => state === "applicable",
  /** 7.2.6 — `blocked` verhindert weitere Umsetzung. */
  blocksImplementation: (state: RegulatoryLifecycleState): boolean => state === "blocked",
  /** 7.2.7 — `superseded`/`repealed` deaktivieren aktive Pflichtaufgaben. */
  deactivatesObligations: (state: RegulatoryLifecycleState): boolean =>
    state === "superseded" || state === "repealed",
} as const;
