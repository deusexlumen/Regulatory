/**
 * SPEC v2 §11.2–§11.4 — Slot-Komponenten.
 *
 * Alle drei Komponenten sind **reine Views auf `LegalTextSlot`** (§6.9) und
 * keine eigenständigen Datenstrukturen (F-10). Sie besitzen keine eigenen
 * Status- oder Freigabefelder; jedes angezeigte Feld stammt aus dem
 * referenzierten `LegalTextSlot`. Die Zuordnung läuft ausschließlich über
 * `LegalTextSlot.slotKey` nach der Konvention aus §11.1.
 */
import type { ReactNode } from "react";
import { SLOT_KEYS } from "../domain/slugs.js";
import { findSlotByKey } from "../domain/dataset.js";
import type { LegalTextSlot } from "../domain/types.js";
import { LegalTextRenderer } from "./LegalTextRenderer.js";

interface SlotViewProps {
  /** Die verfügbaren Slots — üblicherweise `dataset.legalTextSlots`. */
  slots: readonly LegalTextSlot[];
  /** Freigegebener Inhalt aus einer der Quellen nach §12.1. */
  approvedContent?: ReactNode;
  /** Überschreibt den Standard-slotKey, z. B. für weitere Zwecke desselben Rechtsakts. */
  slotKey?: string;
}

/**
 * §11.2 — AccessibilityStatementSlot.
 *
 * Rendert den `LegalTextSlot` mit `slotKey: "bfsg.accessibility_statement"`.
 * Die Platzierung (Footer oder Servicemenü) stammt aus `LegalTextSlot.placement`.
 */
export function AccessibilityStatementSlot({
  slots,
  approvedContent,
  slotKey = SLOT_KEYS.bfsgAccessibilityStatement,
  feedbackHref,
}: SlotViewProps & {
  /** Feedback-/Kontaktmechanismus zur Barrierefreiheit (§5.1, §10.3). */
  feedbackHref?: string;
}): ReactNode {
  const slot = findSlotByKey(slots, slotKey);
  return (
    <section aria-label="Barrierefreiheitserklärung" data-slot-placement={slot?.placement ?? "unset"}>
      <h2>Barrierefreiheit</h2>
      <LegalTextRenderer
        slot={slot}
        slotKey={slotKey}
        label="Barrierefreiheitserklärung"
        {...(approvedContent !== undefined ? { approvedContent } : {})}
      />
      {feedbackHref !== undefined ? (
        <p>
          <a href={feedbackHref}>Barriere melden oder Unterstützung anfragen</a>
        </p>
      ) : null}
    </section>
  );
}

/**
 * §11.3 — AiDisclosureNotice.
 *
 * Rendert den `LegalTextSlot` mit `slotKey: "eu_ai_act.disclosure_notice"`
 * (oder einem übergebenen abweichenden Key, z. B. für die Kennzeichnung
 * synthetischer Inhalte). Vor der Freigabe wird ausschließlich ein
 * vorbereiteter Platzhalter gerendert.
 */
export function AiDisclosureNotice({
  slots,
  approvedContent,
  slotKey = SLOT_KEYS.aiActDisclosureNotice,
}: SlotViewProps): ReactNode {
  const slot = findSlotByKey(slots, slotKey);
  return (
    <section aria-label="Hinweis zu KI-Funktionen" data-slot-placement={slot?.placement ?? "unset"}>
      <h2>KI-Hinweis</h2>
      <LegalTextRenderer
        slot={slot}
        slotKey={slotKey}
        label="Hinweis zu KI-Funktionen"
        {...(approvedContent !== undefined ? { approvedContent } : {})}
      />
    </section>
  );
}

/**
 * §11.4 — DataTransparencyNotice.
 *
 * Rendert den `LegalTextSlot` mit `slotKey: "eu_data_act.transparency_notice"`.
 * Rendering-Regel identisch zu §11.2/§11.3.
 */
export function DataTransparencyNotice({
  slots,
  approvedContent,
  slotKey = SLOT_KEYS.dataActTransparencyNotice,
}: SlotViewProps): ReactNode {
  const slot = findSlotByKey(slots, slotKey);
  return (
    <section aria-label="Hinweis zur Datennutzung" data-slot-placement={slot?.placement ?? "unset"}>
      <h2>Datennutzung</h2>
      <LegalTextRenderer
        slot={slot}
        slotKey={slotKey}
        label="Hinweis zur Datennutzung"
        {...(approvedContent !== undefined ? { approvedContent } : {})}
      />
    </section>
  );
}
