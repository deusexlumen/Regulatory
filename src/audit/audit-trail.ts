/**
 * SPEC v2 §14 — Audit und Nachweis.
 *
 * Der AuditTrail ist die einzige Schreibstelle für `AuditEntry`. Er erzwingt
 * §14.2 (Zeitstempel, Akteur, Aktion, Zielobjekttyp, Zielobjekt-ID) und deckt
 * `source_record` sowie `applicability_assessment` als Zielobjekttypen ab
 * (F-05, §6.12).
 */
import type { Clock } from "../time/clock.js";
import { systemClock } from "../time/clock.js";
import type { AuditEntry, AuditTargetType } from "../domain/types.js";

export interface AuditEvent {
  actor: AuditEntry["actor"];
  action: AuditEntry["action"];
  targetType: AuditTargetType;
  targetId: string;
  reason?: string;
  sourceReferenceIds?: string[];
}

export class AuditTrail {
  readonly #entries: AuditEntry[] = [];
  readonly #clock: Clock;
  #sequence = 0;

  constructor(options: { clock?: Clock; entries?: readonly AuditEntry[] } = {}) {
    this.#clock = options.clock ?? systemClock;
    if (options.entries) {
      this.#entries.push(...options.entries.map((entry) => ({ ...entry })));
      this.#sequence = this.#entries.length;
    }
  }

  /** Protokolliert ein Ereignis und gibt den erzeugten Eintrag zurück. */
  record(event: AuditEvent): AuditEntry {
    if (event.targetId.trim() === "") {
      throw new TypeError("AuditEntry ohne targetId ist unzulässig (§14.2).");
    }
    this.#sequence += 1;
    const entry: AuditEntry = {
      id: `audit-${String(this.#sequence).padStart(4, "0")}`,
      timestamp: this.#clock.now(),
      actor: event.actor,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ...(event.reason !== undefined ? { reason: event.reason } : {}),
      ...(event.sourceReferenceIds !== undefined
        ? { sourceReferenceIds: [...event.sourceReferenceIds] }
        : {}),
    };
    this.#entries.push(entry);
    return entry;
  }

  entries(): AuditEntry[] {
    return this.#entries.map((entry) => ({ ...entry }));
  }

  find(predicate: (entry: AuditEntry) => boolean): AuditEntry[] {
    return this.#entries.filter(predicate).map((entry) => ({ ...entry }));
  }

  forTarget(targetType: AuditTargetType, targetId: string): AuditEntry[] {
    return this.find((entry) => entry.targetType === targetType && entry.targetId === targetId);
  }

  /**
   * §13.2 / §7.3.2 — gibt es eine dokumentierte Freigabe für ein Zielobjekt?
   */
  hasApproval(targetType: AuditTargetType, targetId: string): boolean {
    return this.#entries.some(
      (entry) =>
        entry.targetType === targetType &&
        entry.targetId === targetId &&
        entry.action === "approve" &&
        entry.actor === "legal_reviewer",
    );
  }

  get size(): number {
    return this.#entries.length;
  }
}
