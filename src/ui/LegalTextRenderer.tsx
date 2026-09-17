/**
 * SPEC v2 §11.5 — LegalTextRenderer.
 *
 * Die einzige Komponente, die Rechtstexte rendern darf. Alle Slot-Komponenten
 * aus §11.2–§11.4 delegieren an sie.
 *
 * Regeln:
 * 1. Rendern nur bei `status === "approved"`.
 * 2. Bei `draft`, `empty` oder `needs_review` nur Platzhalter.
 * 3. Platzhalter müssen als nicht final erkennbar sein.
 * 4. Platzhalter müssen maschinenlesbar markiert sein.
 *
 * Zusätzlich wird die Invariante aus §6.9/§12.3 (F-11) erzwungen: ein Slot mit
 * `status === "approved"`, dem `approvedBy`, `approvedAt` oder jede Referenz
 * fehlt, gilt als nicht freigabekonform und wird als Platzhalter gerendert.
 * UI-Code kann die Invariante damit nicht umgehen.
 */
import type { ReactNode } from "react";
import type { LegalTextSlot } from "../domain/types.js";
import { isSlotReleaseCompliant } from "../engine/roadmap.js";

export type PendingReason =
  | "slot_missing"
  | "not_approved"
  | "approval_incomplete"
  | "content_missing";

export interface LegalTextRendererProps {
  /** Der referenzierte Slot; `undefined`, wenn für den slotKey keiner existiert. */
  slot: LegalTextSlot | undefined;
  /** Der slotKey, der erwartet wurde — auch dann gesetzt, wenn `slot` fehlt. */
  slotKey: string;
  /** Zugänglicher Name der Region (§13.4: "Disclosure-Komponente hat accessible name"). */
  label: string;
  /**
   * Freigegebener Rechtstext aus Generator, Kanzlei, offizieller Quelle oder
   * interner Freigabe (§12.1). Wird vom Anwendungscode bereitgestellt — das
   * Modul erzeugt selbst keinen Rechtstext (§3.2, §12.2).
   */
  approvedContent?: ReactNode;
}

const PENDING_TEXT: Record<PendingReason, string> = {
  slot_missing: "Rechtstext-Slot nicht angelegt – bitte Slot erzeugen und Freigabe einholen",
  not_approved: "Rechtstext ausstehend – bitte über Generator oder Freigabe einbinden",
  approval_incomplete:
    "Rechtstext nicht freigabekonform – approvedBy, approvedAt und eine Quellenreferenz fehlen",
  content_missing:
    "Rechtstext freigegeben, aber kein Inhalt übergeben – freigegebenen Text einbinden",
};

export function pendingReasonFor(
  slot: LegalTextSlot | undefined,
  hasContent: boolean,
): PendingReason | undefined {
  if (slot === undefined) return "slot_missing";
  if (slot.status !== "approved") return "not_approved";
  if (!isSlotReleaseCompliant(slot)) return "approval_incomplete";
  if (!hasContent) return "content_missing";
  return undefined;
}

export function LegalTextRenderer({
  slot,
  slotKey,
  label,
  approvedContent,
}: LegalTextRendererProps): ReactNode {
  const hasContent = approvedContent !== undefined && approvedContent !== null;
  const pending = pendingReasonFor(slot, hasContent);

  if (pending !== undefined) {
    return (
      <div
        data-legal-slot-pending="true"
        data-legal-slot-key={slotKey}
        data-legal-slot-status={slot?.status ?? "missing"}
        data-legal-slot-pending-reason={pending}
        role="note"
        aria-label={`${label} – noch nicht freigegeben`}
      >
        [{PENDING_TEXT[pending]}]
      </div>
    );
  }

  return (
    <div
      data-legal-slot-pending="false"
      data-legal-slot-key={slotKey}
      data-legal-slot-status="approved"
      data-legal-slot-version={slot?.version ?? ""}
      data-legal-slot-source={slot?.textSource ?? ""}
    >
      {approvedContent}
    </div>
  );
}
