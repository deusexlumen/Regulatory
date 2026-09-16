/**
 * Beispielseite für die Accessibility-Basis-Tests (§13.4).
 *
 * Sie enthält ausschließlich vorbereitete Strukturen und Platzhalter — keine
 * finalen Rechtstexte (§4.5, §12.4).
 */
import type { ReactNode } from "react";
import type { LegalTextSlot } from "../domain/types.js";
import { SLOT_KEYS } from "../domain/slugs.js";
import { AccessibilityStatementSlot, AiDisclosureNotice, DataTransparencyNotice } from "./slots.js";

export function ExamplePage({ slots }: { slots: readonly LegalTextSlot[] }): ReactNode {
  return (
    <>
      <header>
        <h1>Beispielseite mit vorbereiteten Rechtstext-Slots</h1>
      </header>
      <main>
        <AiDisclosureNotice slots={slots} />
        <AiDisclosureNotice slots={slots} slotKey={SLOT_KEYS.aiActSyntheticContentNotice} />
        <DataTransparencyNotice slots={slots} />
        <p>
          <label htmlFor="example-search">Suche</label>{" "}
          <input id="example-search" type="search" name="q" />
        </p>
        <p>
          <button type="button">Einstellungen öffnen</button>
        </p>
      </main>
      <footer>
        <AccessibilityStatementSlot slots={slots} feedbackHref="/kontakt/barrierefreiheit" />
      </footer>
    </>
  );
}
