/**
 * SPEC v2 §15.4 — Open Questions Report.
 *
 * Inhalt: fehlende Quellen, unklare Fristen, unklare Anwendbarkeit, rechtlicher
 * Prüfbedarf, fehlende Freigaben, technische Blocker.
 *
 * §4 Grundprinzip: Unsicherheiten werden nicht verschleiert, sondern benannt.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import { indexById } from "../domain/dataset.js";
import type { Clock } from "../time/clock.js";
import { systemClock } from "../time/clock.js";
import { buildRoadmap, deriveDeadlineHint, isSlotReleaseCompliant } from "../engine/roadmap.js";
import { currentAssessment } from "../engine/applicability.js";
import { slotReleaseViolation } from "../policy/validate.js";
import { SPEC_VERIFICATION_FINDINGS, VERIFICATION_LIMITATION } from "../data/source-verification.js";

export interface OpenQuestion {
  category:
    | "missing_source"
    | "unclear_deadline"
    | "unclear_applicability"
    | "legal_review"
    | "missing_approval"
    | "technical_blocker";
  targetType: string;
  targetId: string;
  question: string;
}

const CATEGORY_TITLE: Record<OpenQuestion["category"], string> = {
  missing_source: "Fehlende Quellen",
  unclear_deadline: "Unklare Fristen",
  unclear_applicability: "Unklare Anwendbarkeit",
  legal_review: "Rechtlicher Prüfbedarf",
  missing_approval: "Fehlende Freigaben",
  technical_blocker: "Technische Blocker",
};

const CATEGORY_ORDER: OpenQuestion["category"][] = [
  "missing_source",
  "unclear_deadline",
  "unclear_applicability",
  "legal_review",
  "missing_approval",
  "technical_blocker",
];

export function collectOpenQuestions(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: { clock?: Clock } = {},
): OpenQuestion[] {
  const clock = options.clock ?? systemClock;
  const questions: OpenQuestion[] = [];
  const acts = indexById(dataset.legalActs);

  // --------------------------------------------------- fehlende Quellen ----
  for (const act of dataset.legalActs) {
    if (act.sourceRecords.length === 0) {
      questions.push({
        category: "missing_source",
        targetType: "legal_act",
        targetId: act.id,
        question: `Für ${act.slug} ist keine Quelle erfasst. Welche amtliche Fundstelle gilt? (§4.1)`,
      });
    }
  }
  for (const obligation of dataset.obligations) {
    if (obligation.sourceRecords.length === 0) {
      questions.push({
        category: "missing_source",
        targetType: "obligation",
        targetId: obligation.id,
        question: `Pflicht "${obligation.title}" hat keine Quelle. (§13.2)`,
      });
    }
  }
  for (const record of dataset.sourceRecords) {
    if (record.confidence !== "high") {
      questions.push({
        category: "missing_source",
        targetType: "source_record",
        targetId: record.id,
        question:
          `${record.officialIdentifier ?? record.id} hat confidence "${record.confidence}". ` +
          "Direktprüfung am Primärtext ausstehend.",
      });
    }
  }
  for (const finding of SPEC_VERIFICATION_FINDINGS) {
    if (finding.openQuestion !== undefined) {
      questions.push({
        category: finding.result === "corrected" ? "legal_review" : "missing_source",
        targetType: "spec_verification",
        targetId: finding.id,
        question: `${finding.specSection} (${finding.slug}): ${finding.openQuestion}`,
      });
    }
  }

  // ---------------------------------------------------- unklare Fristen ----
  for (const act of dataset.legalActs) {
    if (deriveDeadlineHint(act) === undefined) {
      questions.push({
        category: "unclear_deadline",
        targetType: "legal_act",
        targetId: act.id,
        question:
          `Für ${act.slug} ist keine Frist ableitbar (transitionEnd/applicableDate/effectiveDate leer ` +
          `oder Entwurfsstadium \`${act.lifecycleState}\`). Es wird bewusst keine Frist behauptet (§9.4.1).`,
      });
    }
  }

  // ----------------------------------------- unklare Anwendbarkeit / Review -
  for (const act of dataset.legalActs) {
    const assessment = currentAssessment(dataset.applicabilityAssessments, act.id, projectProfileId);
    if (assessment === undefined) {
      questions.push({
        category: "unclear_applicability",
        targetType: "legal_act",
        targetId: act.id,
        question: `Keine gültige Anwendbarkeitsbewertung für Profil ${projectProfileId}. (§8.2)`,
      });
      continue;
    }
    if (assessment.confidence === "low") {
      questions.push({
        category: "unclear_applicability",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        question:
          `${act.slug}: Anwendbarkeit mit confidence "low" bewertet. ${assessment.reasons.join(" ")}`,
      });
    }
    if (assessment.needsLegalReview && assessment.reviewedBy === undefined) {
      questions.push({
        category: "legal_review",
        targetType: "applicability_assessment",
        targetId: assessment.id,
        question: `${act.slug}: needsLegalReview gesetzt, aber noch kein reviewedBy/reviewedAt erfasst. (§6.6, F-16)`,
      });
    }
    if (act.reviewStatus === "needs_legal_review") {
      questions.push({
        category: "legal_review",
        targetType: "legal_act",
        targetId: act.id,
        question: `${act.slug} steht auf reviewStatus "needs_legal_review". ${act.summary ?? ""}`.trim(),
      });
    }
  }
  for (const obligation of dataset.obligations) {
    if (obligation.needsLegalReview) {
      const act = acts.get(obligation.legalActId);
      questions.push({
        category: "legal_review",
        targetType: "obligation",
        targetId: obligation.id,
        question:
          `${act?.slug ?? obligation.legalActId} — "${obligation.title}": ` +
          `${obligation.description ?? "Prüfbedarf markiert."}`,
      });
    }
  }

  // ------------------------------------------------- fehlende Freigaben ----
  for (const slot of dataset.legalTextSlots) {
    const violation = slotReleaseViolation(slot);
    if (violation !== undefined) {
      questions.push({
        category: "missing_approval",
        targetType: "legal_text_slot",
        targetId: slot.id,
        question: `Slot \`${slot.slotKey}\`: ${violation}`,
      });
    } else if (!isSlotReleaseCompliant(slot)) {
      questions.push({
        category: "missing_approval",
        targetType: "legal_text_slot",
        targetId: slot.id,
        question:
          `Slot \`${slot.slotKey}\` ist nicht freigegeben (status "${slot.status}", textSource ` +
          `"${slot.textSource}"). Rechtstext muss aus Generator, Kanzlei, offizieller Quelle oder ` +
          "interner Freigabe stammen (§12.1).",
      });
    }
  }
  for (const artifact of dataset.evidenceArtifacts) {
    if (artifact.status !== "approved") {
      questions.push({
        category: "missing_approval",
        targetType: "evidence",
        targetId: artifact.id,
        question: `Nachweis "${artifact.type}" hat Status "${artifact.status}" — Freigabe ausstehend. (§4.7)`,
      });
    }
  }

  // ------------------------------------------------- technische Blocker ----
  for (const control of dataset.complianceControls) {
    if (control.implementationState === "blocked") {
      questions.push({
        category: "technical_blocker",
        targetType: "control",
        targetId: control.id,
        question: `Kontrolle "${control.title}" ist blockiert. ${control.notes ?? ""}`.trim(),
      });
    }
  }
  for (const task of dataset.implementationTasks) {
    if (task.state === "blocked") {
      questions.push({
        category: "technical_blocker",
        targetType: "task",
        targetId: task.id,
        question: `Task "${task.title}" ist blockiert. (§6.8, F-07)`,
      });
    }
  }
  for (const item of buildRoadmap(dataset, projectProfileId, { clock })) {
    for (const blocker of item.blockers) {
      if (blocker.startsWith("Rechtsakt") && blocker.includes("blockiert")) {
        questions.push({
          category: "technical_blocker",
          targetType: "roadmap_item",
          targetId: item.id,
          question: blocker,
        });
      }
    }
  }

  return questions;
}

export function renderOpenQuestions(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: { clock?: Clock } = {},
): string {
  const clock = options.clock ?? systemClock;
  const questions = collectOpenQuestions(dataset, projectProfileId, { clock });
  const profile = dataset.projectProfiles.find((p) => p.id === projectProfileId);

  const lines: string[] = [];
  lines.push(`# Open Questions Report — ${profile?.name ?? projectProfileId}`);
  lines.push("");
  lines.push(`Stand: ${clock.today()} (Zeitzone Europe/Berlin)`);
  lines.push("");
  lines.push(
    "> Dieser Report listet bewusst jede offene Unsicherheit. Nichts davon darf durch Vereinfachung " +
      "verschwinden (§3 Nicht-Ziel 9).",
  );
  lines.push("");

  lines.push("## Gegenprüfung der Arbeitsstand-Daten aus §5");
  lines.push("");
  lines.push(`_${VERIFICATION_LIMITATION}_`);
  lines.push("");
  lines.push("| ID | Abschnitt | Rechtsakt | Angabe | Ergebnis | Befund |");
  lines.push("|---|---|---|---|---|---|");
  for (const finding of SPEC_VERIFICATION_FINDINGS) {
    lines.push(
      `| ${finding.id} | ${finding.specSection} | \`${finding.slug}\` | ${finding.claim} | ` +
        `**${finding.result}** | ${finding.finding} |`,
    );
  }
  lines.push("");

  for (const category of CATEGORY_ORDER) {
    const inCategory = questions.filter((q) => q.category === category);
    lines.push(`## ${CATEGORY_TITLE[category]} (${inCategory.length})`);
    lines.push("");
    if (inCategory.length === 0) {
      lines.push("_Keine offenen Punkte._");
    } else {
      for (const question of inCategory) {
        lines.push(`- \`${question.targetType}:${question.targetId}\` — ${question.question}`);
      }
    }
    lines.push("");
  }

  lines.push(`**Gesamt: ${questions.length} offene Punkte.**`);
  lines.push("");
  return lines.join("\n");
}
