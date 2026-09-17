/**
 * SPEC v2 §15.1 — Markdown Roadmap.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import { indexById } from "../domain/dataset.js";
import type { Priority, RoadmapItem } from "../domain/types.js";
import type { Clock } from "../time/clock.js";
import { daysUntil, systemClock } from "../time/clock.js";
import { buildRoadmapResult } from "../engine/roadmap.js";
import { currentAssessment } from "../engine/applicability.js";

const DISCLAIMER =
  "> **Kein Rechtsrat.** Dieser Report ist ein technisches Steuerungsdokument. Er ersetzt weder eine " +
  "rechtliche Prüfung noch eine Freigabe. Alle regulatorischen Angaben sind Arbeitsstand und an die " +
  "verlinkten Quellen gebunden (§1, §3).";

const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const APPLICABILITY_LABEL: Record<RoadmapItem["applicability"], string> = {
  applicable: "anwendbar",
  possibly_applicable: "möglicherweise anwendbar",
  not_applicable: "nicht anwendbar",
  needs_legal_review: "rechtliche Prüfung erforderlich",
};

function deadlineCell(deadline: string | undefined, clock: Clock): string {
  if (deadline === undefined) return "keine bestätigte Frist (§9.4.1)";
  const remaining = daysUntil(deadline, clock);
  if (remaining === undefined) return deadline;
  if (remaining < 0) return `${deadline} (seit ${Math.abs(remaining)} Tagen überfällig)`;
  return `${deadline} (in ${remaining} Tagen)`;
}

export function renderMarkdownRoadmap(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: { clock?: Clock } = {},
): string {
  const clock = options.clock ?? systemClock;
  const { items, diagnostics } = buildRoadmapResult(dataset, projectProfileId, { clock });
  const diagnosticsById = new Map(diagnostics.map((d) => [d.itemId, d]));
  const acts = indexById(dataset.legalActs);
  const obligations = indexById(dataset.obligations);
  const controls = indexById(dataset.complianceControls);
  const profile = dataset.projectProfiles.find((p) => p.id === projectProfileId);

  const lines: string[] = [];
  lines.push(`# Regulatory Roadmap — ${profile?.name ?? projectProfileId}`);
  lines.push("");
  lines.push(`Stand: ${clock.today()} (Fristenbezug: Zeitzone Europe/Berlin, §9.5.2)`);
  lines.push("");
  lines.push(DISCLAIMER);
  lines.push("");

  // ---------------------------------------------------------- Überblick ----
  lines.push("## 1. Regulierungen und Anwendbarkeit");
  lines.push("");
  lines.push("| Rechtsakt | Lifecycle | Anwendbarkeit | Konfidenz | Frist | Roadmap-Items | Höchste Priorität |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const act of dataset.legalActs) {
    const assessment = currentAssessment(dataset.applicabilityAssessments, act.id, projectProfileId);
    const actItems = items.filter((i) => i.legalActId === act.id);
    const top = actItems[0];
    lines.push(
      `| ${act.shortName ?? act.name} (\`${act.slug}\`) | \`${act.lifecycleState}\` | ` +
        `${assessment ? APPLICABILITY_LABEL[deriveLabel(assessment.applicable, assessment.confidence, assessment.needsLegalReview)] : "keine Bewertung"} | ` +
        `${assessment?.confidence ?? "–"} | ${deadlineCell(top?.deadlineHint ?? deriveActDeadline(act), clock)} | ` +
        `${actItems.length} | ${top ? PRIORITY_LABEL[top.priority] : "–"} |`,
    );
  }
  lines.push("");

  // ------------------------------------------------ Priorisierte Maßnahmen -
  lines.push("## 2. Priorisierte Maßnahmen");
  lines.push("");
  if (items.length === 0) {
    lines.push(
      "_Keine Roadmap-Items. Für dieses Profil wurde keine Regulierung als anwendbar bewertet " +
        "(§8.3 Regel 6)._",
    );
    lines.push("");
  }
  for (const item of items) {
    const act = acts.get(item.legalActId);
    const obligation = item.obligationId !== undefined ? obligations.get(item.obligationId) : undefined;
    const control =
      item.complianceControlId !== undefined ? controls.get(item.complianceControlId) : undefined;
    const diag = diagnosticsById.get(item.id);

    lines.push(`### [${PRIORITY_LABEL[item.priority]}] ${obligation?.title ?? item.id}`);
    lines.push("");
    lines.push(`- **Rechtsakt:** ${act?.shortName ?? act?.name ?? item.legalActId} (\`${act?.slug ?? "?"}\`), Lifecycle \`${item.lifecycleState}\``);
    if (obligation?.normReference !== undefined) {
      lines.push(`- **Norm:** ${obligation.normReference}`);
    }
    lines.push(
      `- **Kontrolle:** ${
        control !== undefined
          ? `${control.title} (\`${control.id}\`, Status \`${control.implementationState}\`)`
          : `zusammengefasst über mehrere Kontrollen, ungünstigster Status \`${diag?.worstControlState ?? "–"}\` (§9.6)`
      }`,
    );
    lines.push(`- **Anwendbarkeit:** ${APPLICABILITY_LABEL[item.applicability]}`);
    lines.push(`- **Frist:** ${deadlineCell(item.deadlineHint, clock)}`);
    lines.push(`- **Priorität:** ${PRIORITY_LABEL[item.priority]} — ${diag?.priorityExplanation ?? ""} (Regel §9.3.${diag?.priorityRule ?? "?"})`);
    lines.push(`- **Empfohlene Aktion:** ${item.recommendedAction}`);
    lines.push(`- **Architekturvorbereitung:** ${item.architecturePreparationRequired ? "erforderlich" : "nicht erforderlich"}`);
    lines.push(`- **Rechtstextbedarf:** ${item.legalTextUpdateRequired ? "ja — Slot ist nicht freigegeben" : "nein"}`);
    lines.push(`- **Review-Bedarf:** ${item.legalReviewRequired ? "ja" : "nein"}`);
    lines.push(
      `- **Abhängigkeiten:** ${item.dependencies.length > 0 ? item.dependencies.map((d) => `\`${d}\``).join(", ") : "keine"}`,
    );
    if (item.blockers.length > 0) {
      lines.push("- **Blocker:**");
      for (const blocker of item.blockers) lines.push(`  - ${blocker}`);
    } else {
      lines.push("- **Blocker:** keine");
    }
    lines.push("");
  }

  // ------------------------------------------------------ Nächste Schritte -
  lines.push("## 3. Nächste Schritte");
  lines.push("");
  const nextSteps = items
    .filter((i) => i.priority === "critical" || i.priority === "high")
    .slice(0, 10);
  if (nextSteps.length === 0) {
    lines.push("- Monitoring fortführen; derzeit keine Maßnahme mit Priorität `critical` oder `high`.");
  } else {
    for (const item of nextSteps) {
      const obligation = item.obligationId !== undefined ? obligations.get(item.obligationId) : undefined;
      lines.push(`- **${PRIORITY_LABEL[item.priority]}** ${obligation?.title ?? item.id}: ${item.recommendedAction}`);
    }
  }
  lines.push("");
  lines.push(
    "Offene rechtliche Punkte, fehlende Quellen und fehlende Freigaben sind im Open-Questions-Report " +
      "(`open-questions.md`, §15.4) gelistet.",
  );
  lines.push("");

  return lines.join("\n");
}

function deriveLabel(
  applicable: boolean,
  confidence: "high" | "medium" | "low",
  needsLegalReview: boolean,
): RoadmapItem["applicability"] {
  if (needsLegalReview) return "needs_legal_review";
  if (applicable && confidence !== "low") return "applicable";
  if (applicable) return "possibly_applicable";
  return "not_applicable";
}

function deriveActDeadline(act: { transitionEnd?: string; applicableDate?: string; effectiveDate?: string }) {
  return act.transitionEnd ?? act.applicableDate ?? act.effectiveDate;
}
