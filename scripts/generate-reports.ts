/**
 * SPEC v2 §16 Schritt 13/14 — erzeugt Markdown- und JSON-Reports sowie den
 * Open-Questions-Report in `reports/`.
 *
 * Aufruf: `npm run reports` (optional mit `--profile <id>` und
 * `--date YYYY-MM-DD` für einen deterministischen Stichtag).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedDataset } from "../src/data/seed.js";
import { DEFAULT_PROFILE_ID, projectProfiles } from "../src/data/project-profiles.js";
import { fixedClock, systemClock } from "../src/time/clock.js";
import { renderMarkdownRoadmap } from "../src/reports/markdown-roadmap.js";
import { renderJsonExport } from "../src/reports/json-export.js";
import { renderChecklistsMarkdown } from "../src/reports/checklist-report.js";
import { renderOpenQuestions } from "../src/reports/open-questions.js";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const date = arg("date");
const clock = date !== undefined ? fixedClock(date) : systemClock;
const only = arg("profile");
const profiles = only !== undefined ? projectProfiles.filter((p) => p.id === only) : projectProfiles;
if (profiles.length === 0) {
  console.error(`Unbekanntes Profil: ${only}`);
  process.exit(1);
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "reports");
mkdirSync(outDir, { recursive: true });

for (const profile of profiles) {
  const suffix = profile.id === DEFAULT_PROFILE_ID ? "" : `.${profile.id}`;
  const files: Array<[string, string]> = [
    [`roadmap${suffix}.md`, renderMarkdownRoadmap(seedDataset, profile.id, { clock })],
    [`checklists${suffix}.md`, renderChecklistsMarkdown(seedDataset, profile.id)],
    [`open-questions${suffix}.md`, renderOpenQuestions(seedDataset, profile.id, { clock })],
    [`regulatory-data${suffix}.json`, renderJsonExport(seedDataset, profile.id, { clock })],
  ];
  for (const [name, content] of files) {
    writeFileSync(join(outDir, name), content, "utf8");
    console.log(`geschrieben: reports/${name}`);
  }
}
