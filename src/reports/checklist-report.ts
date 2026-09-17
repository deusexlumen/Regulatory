/**
 * SPEC v2 §15.3 — Checklists als Markdown.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import type { Checklist, ChecklistItem } from "../domain/types.js";
import { generateAllChecklists } from "../engine/checklist.js";

const STATE_MARK: Record<ChecklistItem["state"], string> = {
  not_started: "[ ]",
  prepared: "[~]",
  in_progress: "[~]",
  needs_review: "[?]",
  done: "[x]",
  blocked: "[!]",
};

function renderChecklist(checklist: Checklist): string[] {
  const lines: string[] = [];
  lines.push(`## ${checklist.title}`);
  lines.push("");
  if (checklist.skippedReason !== undefined) {
    lines.push(`_Keine Punkte erzeugt: ${checklist.skippedReason}_`);
    lines.push("");
    return lines;
  }
  lines.push("| | Punkt | Kategorie | Status | Rechtstext | Nachweis | Legal Review |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const item of checklist.items) {
    lines.push(
      `| ${STATE_MARK[item.state]} | ${item.title} | ${item.category} | \`${item.state}\` | ` +
        `${item.requiresLegalText ? "ja" : "–"} | ${item.requiresEvidence ? "ja" : "–"} | ` +
        `${item.needsLegalReview ? "ja" : "–"} |`,
    );
  }
  lines.push("");
  const notes = checklist.items.filter((i) => i.description !== undefined);
  if (notes.length > 0) {
    lines.push("Erläuterungen:");
    lines.push("");
    for (const item of notes) lines.push(`- **${item.title}:** ${item.description}`);
    lines.push("");
  }
  return lines;
}

export function renderChecklistsMarkdown(
  dataset: RegulatoryDataset,
  projectProfileId: string,
): string {
  const profile = dataset.projectProfiles.find((p) => p.id === projectProfileId);
  const lines: string[] = [];
  lines.push(`# Compliance-Checklisten — ${profile?.name ?? projectProfileId}`);
  lines.push("");
  lines.push(
    "Legende: `[ ]` offen · `[~]` vorbereitet/in Arbeit · `[?]` Review nötig · `[x]` erledigt · " +
      "`[!]` blockiert. Der Status wird aus dem Datenmodell abgeleitet (Control-Status §7.4 bzw. " +
      "LegalTextSlot-Status §6.9), nicht frei gesetzt.",
  );
  lines.push("");
  for (const checklist of generateAllChecklists(dataset, projectProfileId)) {
    lines.push(...renderChecklist(checklist));
  }
  return lines.join("\n");
}
