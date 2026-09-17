/**
 * SPEC v2 §6.4 / §7.4 — die beiden getrennten Zustandsmengen (löst F-01).
 *
 * `RegulatoryLifecycleState` beschreibt ausschließlich den Reifegrad eines
 * Rechtsakts (`LegalAct.lifecycleState`, `Obligation.lifecycleState`).
 * `ControlImplementationState` beschreibt ausschließlich den technischen
 * Umsetzungsfortschritt einer einzelnen Kontrolle
 * (`ComplianceControl.implementationState`).
 *
 * Die beiden Mengen dürfen weder im Code noch in der Dokumentation vermischt
 * werden. Insbesondere gibt es in der Rechtsakt-Maschine weder `implemented`
 * noch `needs_review`.
 */
export type RegulatoryLifecycleState =
  | "observed"
  | "draft"
  | "adopted"
  | "published"
  | "in_force"
  | "transition_period"
  | "applicable"
  | "superseded"
  | "repealed"
  | "needs_legal_review"
  | "blocked";

export const REGULATORY_LIFECYCLE_STATES = [
  "observed",
  "draft",
  "adopted",
  "published",
  "in_force",
  "transition_period",
  "applicable",
  "superseded",
  "repealed",
  "needs_legal_review",
  "blocked",
] as const satisfies readonly RegulatoryLifecycleState[];

export type ControlImplementationState =
  | "not_started"
  | "prepared"
  | "in_progress"
  | "needs_review"
  | "implemented"
  | "blocked";

export const CONTROL_IMPLEMENTATION_STATES = [
  "not_started",
  "prepared",
  "in_progress",
  "needs_review",
  "implemented",
  "blocked",
] as const satisfies readonly ControlImplementationState[];

export function isRegulatoryLifecycleState(value: unknown): value is RegulatoryLifecycleState {
  return typeof value === "string" && (REGULATORY_LIFECYCLE_STATES as readonly string[]).includes(value);
}

export function isControlImplementationState(value: unknown): value is ControlImplementationState {
  return typeof value === "string" && (CONTROL_IMPLEMENTATION_STATES as readonly string[]).includes(value);
}

/**
 * SPEC v2 §4.6 / §7.2.3 — ab `published` ist das Rechtstext-Aktualisierungs-
 * fenster geöffnet. Davor darf kein Rechtstext-Update gefordert werden.
 */
const CONTENT_WINDOW_STATES: readonly RegulatoryLifecycleState[] = [
  "published",
  "in_force",
  "transition_period",
  "applicable",
];

export function opensContentWindow(state: RegulatoryLifecycleState): boolean {
  return CONTENT_WINDOW_STATES.includes(state);
}

/** SPEC v2 §4.5 / §9.4.4 — Entwurfsstadium erlaubt nur Architekturvorbereitung. */
export function isDraftStage(state: RegulatoryLifecycleState): boolean {
  return state === "observed" || state === "draft";
}

/** SPEC v2 §7.2.6 / §7.2.7 — Zustände, die aktive Pflichtaufgaben stilllegen. */
export function isInactiveState(state: RegulatoryLifecycleState): boolean {
  return state === "superseded" || state === "repealed" || state === "blocked";
}
