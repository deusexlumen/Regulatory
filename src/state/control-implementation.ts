/**
 * SPEC v2 §7.4 — Control-Implementierungsstatus
 * (`ComplianceControl.implementationState`).
 *
 * Getrennte, unabhängige Zustandsmaschine für den technischen Umsetzungs-
 * fortschritt. Sie wird nie mit der Rechtsakt-Maschine (§7.1) vermischt.
 */
import type { ControlImplementationState } from "../domain/lifecycle-states.js";
import type { ComplianceControl } from "../domain/types.js";

const TRANSITIONS: Readonly<Record<ControlImplementationState, readonly ControlImplementationState[]>> = {
  not_started: ["prepared"],
  prepared: ["in_progress"],
  in_progress: ["needs_review"],
  needs_review: ["implemented", "in_progress"],
  implemented: ["needs_review"],
  blocked: ["in_progress"],
};

/** `any -> blocked` (§7.4). */
const UNIVERSAL_TARGET: ControlImplementationState = "blocked";

export function checkControlTransition(
  from: ControlImplementationState,
  to: ControlImplementationState,
): { allowed: boolean; reason?: string } {
  if (from === to) {
    return { allowed: false, reason: `Selbstübergang ${from} -> ${to} ist nicht definiert.` };
  }
  if (to === UNIVERSAL_TARGET) return { allowed: true };
  if ((TRANSITIONS[from] ?? []).includes(to)) return { allowed: true };
  return {
    allowed: false,
    reason: `Übergang ${from} -> ${to} ist in der Control-Maschine nicht definiert (§7.4).`,
  };
}

export class ControlTransitionError extends Error {
  constructor(
    message: string,
    readonly from: ControlImplementationState,
    readonly to: ControlImplementationState,
  ) {
    super(message);
    this.name = "ControlTransitionError";
  }
}

export function transitionControl(
  control: ComplianceControl,
  to: ControlImplementationState,
): ComplianceControl {
  const check = checkControlTransition(control.implementationState, to);
  if (!check.allowed) {
    throw new ControlTransitionError(
      check.reason ?? "Unzulässiger Übergang.",
      control.implementationState,
      to,
    );
  }
  return { ...control, implementationState: to };
}

/**
 * SPEC v2 §9.6 — "der ungünstigste Zustand gewinnt".
 *
 * Rangfolge vom am wenigsten fortgeschrittenen zum am weitesten
 * fortgeschrittenen Zustand. `blocked` ist bewusst der ungünstigste Zustand:
 * eine blockierte Kontrolle zieht die Priorität nach oben, auch wenn andere
 * Kontrollen derselben Obligation bereits `implemented` sind.
 */
export const CONTROL_PROGRESS_RANK: Readonly<Record<ControlImplementationState, number>> = {
  blocked: 0,
  not_started: 1,
  prepared: 2,
  in_progress: 3,
  needs_review: 4,
  implemented: 5,
};

/** Liefert den am wenigsten fortgeschrittenen Zustand einer Control-Menge. */
export function leastAdvancedState(
  controls: readonly ComplianceControl[],
): ControlImplementationState | undefined {
  let worst: ControlImplementationState | undefined;
  for (const control of controls) {
    if (
      worst === undefined ||
      CONTROL_PROGRESS_RANK[control.implementationState] < CONTROL_PROGRESS_RANK[worst]
    ) {
      worst = control.implementationState;
    }
  }
  return worst;
}

/** §7.4 — "Architektur ist nicht vorbereitet" im Sinne von §9.3 Regel 2. */
export function isArchitectureUnprepared(state: ControlImplementationState | undefined): boolean {
  return state === undefined || state === "not_started" || state === "blocked";
}

/** Mapping Control-Zustand → `ChecklistItem.state` (§10.2). */
export function toChecklistState(
  state: ControlImplementationState,
): "not_started" | "prepared" | "in_progress" | "needs_review" | "done" | "blocked" {
  return state === "implemented" ? "done" : state;
}
