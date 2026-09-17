/**
 * @vitest-environment jsdom
 *
 * SPEC v2 §13.4 — Accessibility-Basis-Tests.
 *
 * Die Tests laufen gegen die Beispielseite aus `src/ui/ExamplePage.tsx`, die
 * ausschließlich vorbereitete Strukturen und Platzhalter enthält (§4.5).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import axe from "axe-core";
import { ExamplePage } from "../src/ui/ExamplePage.js";
import { seedDataset } from "../src/data/seed.js";

const slots = seedDataset.legalTextSlots;

function mount(): void {
  document.documentElement.lang = "de";
  document.title = "Beispielseite Rechtstext-Slots";
  document.body.innerHTML = renderToStaticMarkup(<ExamplePage slots={slots} />);
}

beforeEach(() => {
  mount();
});

describe("§13.4 — Footer-Slot ist semantisch erreichbar", () => {
  it("liegt in einem contentinfo-Landmark und trägt einen zugänglichen Namen", () => {
    const footer = document.querySelector("footer");
    expect(footer).not.toBeNull();
    const region = footer?.querySelector("section[aria-label]");
    expect(region).not.toBeNull();
    expect(region?.getAttribute("aria-label")).toBe("Barrierefreiheitserklärung");
    expect(region?.querySelector("h2")?.textContent).toBeTruthy();
  });
});

describe("§13.4 — Disclosure-Komponente hat accessible name", () => {
  it("benennt jede Slot-Region", () => {
    const regions = [...document.querySelectorAll("section")];
    expect(regions.length).toBeGreaterThanOrEqual(4);
    for (const region of regions) {
      expect(region.getAttribute("aria-label")?.trim()).toBeTruthy();
    }
  });

  it("benennt auch den Platzhalter selbst", () => {
    for (const pending of document.querySelectorAll('[data-legal-slot-pending="true"]')) {
      expect(pending.getAttribute("aria-label")).toContain("noch nicht freigegeben");
      expect(pending.getAttribute("role")).toBe("note");
    }
  });
});

describe("§13.4 — Platzhalter sind als nicht final erkennbar", () => {
  it("markiert jeden Platzhalter maschinenlesbar und im sichtbaren Text", () => {
    const pending = [...document.querySelectorAll('[data-legal-slot-pending="true"]')];
    expect(pending.length).toBeGreaterThan(0);
    for (const node of pending) {
      expect(node.getAttribute("data-legal-slot-key")).toBeTruthy();
      expect(node.getAttribute("data-legal-slot-pending-reason")).toBeTruthy();
      expect(node.textContent?.trim().startsWith("[")).toBe(true);
    }
  });

  it("enthält keinen als final gerenderten Rechtstext", () => {
    expect(document.querySelectorAll('[data-legal-slot-pending="false"]')).toHaveLength(0);
  });
});

describe("§13.4 — keine kritischen Axe-Verletzungen in Beispielkomponenten", () => {
  it("meldet keine Verletzung mit impact critical oder serious", async () => {
    const results = await axe.run(document.body, {
      resultTypes: ["violations"],
      // Kontrastprüfung braucht ein Layout-Engine-Rendering, das jsdom nicht
      // liefert; sie läuft in der visuellen Testebene, nicht hier.
      rules: { "color-contrast": { enabled: false } },
    });
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(
      blocking.map((v) => `${v.id}: ${v.help}`),
      JSON.stringify(blocking.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })), null, 2),
    ).toEqual([]);
  });
});

describe("§13.4 — Fokusreihenfolge ist prüfbar", () => {
  it("enthält fokussierbare Elemente ohne positiven tabindex", () => {
    const focusable = [
      ...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea"),
    ];
    expect(focusable.length).toBeGreaterThan(0);
    for (const element of focusable) {
      const tabIndex = element.getAttribute("tabindex");
      if (tabIndex !== null) expect(Number(tabIndex)).toBeLessThanOrEqual(0);
    }
  });

  it("hält die DOM-Reihenfolge als Fokusreihenfolge fest", () => {
    const focusable = [
      ...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea"),
    ].map((element) => element.tagName.toLowerCase());
    expect(focusable).toEqual(["input", "button", "a"]);
  });
});

describe("§13.4 — Tastaturbedienung ist möglich", () => {
  it("lässt jedes interaktive Element fokussieren", () => {
    const focusable = [
      ...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea"),
    ];
    for (const element of focusable) {
      element.focus();
      expect(document.activeElement).toBe(element);
    }
  });

  it("beschriftet jedes Formularfeld", () => {
    for (const input of document.querySelectorAll<HTMLInputElement>("input")) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const hasAria = input.getAttribute("aria-label") ?? input.getAttribute("aria-labelledby");
      expect(label !== null || hasAria !== null).toBe(true);
    }
  });
});
