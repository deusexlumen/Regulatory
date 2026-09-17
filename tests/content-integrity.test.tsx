/**
 * SPEC v2 §13.5 — Content-Integrity-Tests.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalTextRenderer, pendingReasonFor } from "../src/ui/LegalTextRenderer.js";
import {
  AccessibilityStatementSlot,
  AiDisclosureNotice,
  DataTransparencyNotice,
} from "../src/ui/slots.js";
import { SLOT_KEYS } from "../src/domain/slugs.js";
import type { LegalTextSlot } from "../src/domain/types.js";
import { seedDataset } from "../src/data/seed.js";
import { isSlotReleaseCompliant } from "../src/engine/roadmap.js";
import { slotReleaseViolation } from "../src/policy/validate.js";

const baseSlot: LegalTextSlot = {
  id: "slot-1",
  obligationId: "obl-1",
  slotKey: SLOT_KEYS.bfsgAccessibilityStatement,
  placement: "footer",
  textSource: "not_set",
  status: "empty",
};

const approvedSlot: LegalTextSlot = {
  ...baseSlot,
  textSource: "law_firm",
  status: "approved",
  approvedBy: "legal@example.test",
  approvedAt: "2026-09-16",
  sourceReference: "Kanzleifreigabe 2026-09-16",
  version: "1.0.0",
};

function render(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node);
}

describe("§13.5 — Agent erzeugt keine finalen Rechtstexte", () => {
  it("liefert im Seed keinen einzigen freigegebenen Slot", () => {
    for (const slot of seedDataset.legalTextSlots) {
      expect(slot.status).toBe("empty");
      expect(slot.textSource).toBe("not_set");
      expect(isSlotReleaseCompliant(slot)).toBe(false);
    }
  });

  it("rendert ohne übergebenen Inhalt auch bei Freigabe nur einen Platzhalter", () => {
    const html = render(
      <LegalTextRenderer slot={approvedSlot} slotKey={approvedSlot.slotKey} label="Test" />,
    );
    expect(html).toContain('data-legal-slot-pending="true"');
    expect(html).toContain('data-legal-slot-pending-reason="content_missing"');
  });
});

describe("§11.5 / §13.5 — LegalTextSlot bleibt placeholder-basiert, solange nicht approved", () => {
  it.each(["empty", "draft", "needs_review"] as const)("Status %s ergibt Platzhalter", (status) => {
    const html = render(
      <LegalTextRenderer
        slot={{ ...baseSlot, status }}
        slotKey={baseSlot.slotKey}
        label="Test"
        approvedContent={<p>FINALER TEXT</p>}
      />,
    );
    expect(html).toContain('data-legal-slot-pending="true"');
    expect(html).not.toContain("FINALER TEXT");
  });

  it("rendert bei vollständiger Freigabe den übergebenen Inhalt", () => {
    const html = render(
      <LegalTextRenderer
        slot={approvedSlot}
        slotKey={approvedSlot.slotKey}
        label="Test"
        approvedContent={<p>Freigegebener Text der Kanzlei</p>}
      />,
    );
    expect(html).toContain('data-legal-slot-pending="false"');
    expect(html).toContain("Freigegebener Text der Kanzlei");
    expect(html).toContain('data-legal-slot-source="law_firm"');
  });

  it("rendert einen Platzhalter, wenn der Slot fehlt", () => {
    const html = render(<LegalTextRenderer slot={undefined} slotKey="bfsg.unbekannt" label="Test" />);
    expect(html).toContain('data-legal-slot-pending-reason="slot_missing"');
  });
});

describe("§13.5 — unapproved Slots werden als pending markiert", () => {
  it("markiert Platzhalter maschinenlesbar und erkennbar nicht final (§11.5.3/4)", () => {
    const html = render(<AccessibilityStatementSlot slots={[baseSlot]} />);
    expect(html).toContain('data-legal-slot-pending="true"');
    expect(html).toContain("[");
    expect(html).toContain("ausstehend");
    expect(html).toContain("noch nicht freigegeben");
  });

  it("gilt für alle drei Slot-Komponenten (§11.2–§11.4)", () => {
    const slots = seedDataset.legalTextSlots;
    for (const html of [
      render(<AccessibilityStatementSlot slots={slots} />),
      render(<AiDisclosureNotice slots={slots} />),
      render(<DataTransparencyNotice slots={slots} />),
    ]) {
      expect(html).toContain('data-legal-slot-pending="true"');
    }
  });
});

describe("§12.3 / §13.5 — approved Slots brauchen Begleitfelder (F-11)", () => {
  it("lehnt eine Freigabe ohne approvedBy ab", () => {
    const slot: LegalTextSlot = { ...approvedSlot };
    delete slot.approvedBy;
    expect(isSlotReleaseCompliant(slot)).toBe(false);
    expect(slotReleaseViolation(slot)).toContain("approvedBy");
    expect(pendingReasonFor(slot, true)).toBe("approval_incomplete");
  });

  it("lehnt eine Freigabe ohne approvedAt ab", () => {
    const slot: LegalTextSlot = { ...approvedSlot };
    delete slot.approvedAt;
    expect(slotReleaseViolation(slot)).toContain("approvedAt");
  });

  it("lehnt eine Freigabe ohne Referenz ab", () => {
    const slot: LegalTextSlot = { ...approvedSlot };
    delete slot.sourceReference;
    expect(slotReleaseViolation(slot)).toContain("sourceReference oder externalReference");
  });

  it("akzeptiert externalReference als Alternative", () => {
    const slot: LegalTextSlot = { ...approvedSlot, externalReference: "https://generator.example/export/42" };
    delete slot.sourceReference;
    expect(isSlotReleaseCompliant(slot)).toBe(true);
  });

  it("rendert einen nicht freigabekonformen Slot als Platzhalter — UI kann die Invariante nicht umgehen", () => {
    const slot: LegalTextSlot = { ...approvedSlot };
    delete slot.approvedBy;
    const html = render(
      <AccessibilityStatementSlot slots={[slot]} approvedContent={<p>FINALER TEXT</p>} />,
    );
    expect(html).toContain('data-legal-slot-pending-reason="approval_incomplete"');
    expect(html).not.toContain("FINALER TEXT");
  });
});

describe("§11.1 — Slot-Komponenten sind Views auf LegalTextSlot (F-10)", () => {
  it("übernimmt placement aus dem Slot statt es selbst zu führen", () => {
    const html = render(
      <AiDisclosureNotice
        slots={[{ ...baseSlot, slotKey: SLOT_KEYS.aiActDisclosureNotice, placement: "chat" }]}
      />,
    );
    expect(html).toContain('data-slot-placement="chat"');
  });

  it("findet Slots ausschließlich über den slotKey", () => {
    const html = render(<DataTransparencyNotice slots={[baseSlot]} />);
    expect(html).toContain('data-legal-slot-pending-reason="slot_missing"');
    expect(html).toContain(`data-legal-slot-key="${SLOT_KEYS.dataActTransparencyNotice}"`);
  });

  it("hält sich an die Slot-Key-Konvention <slug_lowercase>.<zweck>", () => {
    for (const key of Object.values(SLOT_KEYS)) {
      expect(key).toMatch(/^(bfsg|eu_ai_act|eu_data_act)\.[a-z0-9_]+$/);
    }
  });
});
