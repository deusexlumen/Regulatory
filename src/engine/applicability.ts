/**
 * SPEC v2 §8 — Anwendbarkeitslogik.
 *
 * Eingabe: ProjectProfile, LegalAct, SourceRecords (§8.1).
 * Ausgabe: ApplicabilityAssessment (§8.2).
 *
 * Die Engine erfindet keine Rechtsfolgen. Sie bildet ausschließlich die in
 * §8.3 formulierten Regeln auf Felder ab und markiert jede Unsicherheit als
 * `needsLegalReview: true` / `confidence: "low"`.
 */
import type {
  ApplicabilityAssessment,
  ApplicabilityLabel,
  Confidence,
  LegalAct,
  ProjectProfile,
} from "../domain/types.js";
import type { LegalActSlug } from "../domain/slugs.js";
import type { RegulatoryDataset } from "../domain/dataset.js";
import type { Clock } from "../time/clock.js";
import { systemClock } from "../time/clock.js";

interface RuleOutcome {
  applicable: boolean;
  confidence: Confidence;
  needsLegalReview: boolean;
  reasons: string[];
}

/**
 * §8.3 Regel 2/3 — "Prüfgegenstand" (F-09).
 *
 * Konkrete Feldbelegung: vorläufig anwendbar, niedrige Konfidenz, Legal Review
 * erforderlich. Die Anwendbarkeit wird also **nicht** stillschweigend verneint.
 */
function pruefgegenstand(reason: string): RuleOutcome {
  return {
    applicable: true,
    confidence: "low",
    needsLegalReview: true,
    reasons: [
      `Prüfgegenstand (§8.3): ${reason}`,
      "Vorläufige Arbeitsannahme applicable:true bei confidence:low — rechtliche Prüfung erforderlich.",
    ],
  };
}

/** §8.3 Regel 1 — harte Ausschlussregel für den AI Act. */
function notApplicable(reason: string): RuleOutcome {
  return { applicable: false, confidence: "high", needsLegalReview: false, reasons: [reason] };
}

function assessBfsg(profile: ProjectProfile): RuleOutcome {
  const signals: string[] = [];
  if (profile.isECommerce) signals.push("isECommerce");
  if (profile.hasAccessibilityRelevantService) signals.push("hasAccessibilityRelevantService");
  if (profile.hasPayment) signals.push("hasPayment");
  if (profile.hasMarketplaceFeatures) signals.push("hasMarketplaceFeatures");

  if (signals.length === 0) {
    return pruefgegenstand(
      "Profil weist weder E-Commerce- noch digitale Dienstleistungsrelevanz aus; BFSG-Anwendbarkeit " +
        "ist damit nicht automatisch gegeben, aber auch nicht ausgeschlossen (Regel 2).",
    );
  }

  const confidence: Confidence =
    profile.accessibilityRelevance === "high"
      ? "high"
      : profile.accessibilityRelevance === "medium"
        ? "medium"
        : "low";

  const reasons = [
    `Dienstleistungs-/E-Commerce-Relevanz im Profil: ${signals.join(", ")}.`,
    `accessibilityRelevance = "${profile.accessibilityRelevance}".`,
  ];
  if (confidence === "low") {
    reasons.push(
      "accessibilityRelevance ist low/unknown — Umfang der Betroffenheit ist nicht bestimmt (§8.3 Regel 5).",
    );
  }
  return { applicable: true, confidence, needsLegalReview: confidence === "low", reasons };
}

function assessAiAct(profile: ProjectProfile): RuleOutcome {
  const direct: string[] = [];
  if (profile.hasAiChatbot) direct.push("hasAiChatbot");
  if (profile.hasAiGeneratedContent) direct.push("hasAiGeneratedContent");
  const indirect = profile.hasAutomatedDecisions;

  if (direct.length === 0 && !indirect) {
    return notApplicable(
      "Profil weist keine KI-Funktion aus (hasAiChatbot, hasAiGeneratedContent, hasAutomatedDecisions " +
        "sind alle false) — es darf keine AI-Act-Pflicht als anwendbar markiert werden (§8.3 Regel 1).",
    );
  }

  if (direct.length > 0) {
    return {
      applicable: true,
      confidence: "high",
      needsLegalReview: false,
      reasons: [
        `KI-Funktion im Profil ausgewiesen: ${direct.join(", ")}.`,
        "Transparenzpflichten für KI-Interaktion und synthetische Inhalte sind einschlägig.",
      ],
    };
  }

  return {
    applicable: true,
    confidence: "medium",
    needsLegalReview: true,
    reasons: [
      "Profil weist automatisierte Entscheidungen aus (hasAutomatedDecisions), aber keine " +
        "Chatbot- oder Generator-Funktion.",
      "Die Einordnung in eine Risikoklasse ist ohne Systeminventar nicht bestimmbar (§8.3 Regel 4).",
    ],
  };
}

function assessDataAct(profile: ProjectProfile): RuleOutcome {
  const signals: string[] = [];
  if (profile.hasIotConnection) signals.push("hasIotConnection");
  if (profile.hasUserGeneratedData) signals.push("hasUserGeneratedData");
  if (profile.hasThirdPartyDataSharing) signals.push("hasThirdPartyDataSharing");

  if (signals.length === 0) {
    return pruefgegenstand(
      "Profil weist weder IoT-, Nutzerdaten- noch Datenzugriffsrelevanz aus; Data-Act-Anwendbarkeit " +
        "ist damit nicht automatisch gegeben, aber auch nicht ausgeschlossen (Regel 3).",
    );
  }

  if (profile.hasIotConnection) {
    return {
      applicable: true,
      confidence: "high",
      needsLegalReview: false,
      reasons: [
        "Profil weist eine IoT-/Connected-Product-Anbindung aus (hasIotConnection) — der " +
          "Kernanwendungsbereich des Data Act ist eröffnet.",
        `Weitere Datensignale: ${signals.join(", ")}.`,
      ],
    };
  }

  return {
    applicable: true,
    confidence: "medium",
    needsLegalReview: true,
    reasons: [
      `Datensignale ohne IoT-Bezug: ${signals.join(", ")}.`,
      "Reichweite der Data-Act-Pflichten ohne vernetztes Produkt ist auslegungsbedürftig (§8.3 Regel 4).",
    ],
  };
}

const RULES: Record<LegalActSlug, (profile: ProjectProfile) => RuleOutcome> = {
  BFSG: assessBfsg,
  EU_AI_ACT: assessAiAct,
  EU_DATA_ACT: assessDataAct,
};

export interface AssessOptions {
  clock?: Clock;
  /** Explizite id, sonst deterministisch aus Act- und Profil-id abgeleitet. */
  id?: string;
  /** §8.1 "manuelle Freigaben" — trägt Reviewer-Angaben nach (F-16). */
  review?: { reviewedBy: string; reviewedAt: string };
}

function assessmentId(act: LegalAct, profile: ProjectProfile, assessedAt: string): string {
  return `asmt-${act.slug.toLowerCase()}-${profile.id}-${assessedAt.slice(0, 10)}`;
}

/**
 * Bewertet einen Rechtsakt gegen ein Projektprofil.
 *
 * `sourceRecordCount` steuert §4.1/§9.4.2: fehlt jede Quelle, sinkt die
 * Konfidenz auf `low` und `needsLegalReview` wird gesetzt — unabhängig davon,
 * wie eindeutig die Profilsignale sind.
 */
export function assessApplicability(
  act: LegalAct,
  profile: ProjectProfile,
  options: AssessOptions & { sourceRecordCount?: number } = {},
): ApplicabilityAssessment {
  const clock = options.clock ?? systemClock;
  const assessedAt = clock.now();
  const rule = RULES[act.slug];
  const outcome = rule(profile);

  let { applicable, confidence, needsLegalReview } = outcome;
  const reasons = [...outcome.reasons];

  const sourceCount = options.sourceRecordCount ?? act.sourceRecords.length;
  if (sourceCount === 0) {
    confidence = "low";
    needsLegalReview = true;
    reasons.push(
      "Für den Rechtsakt ist keine Quelle erfasst (sourceRecords leer) — Konfidenz auf low gesetzt " +
        "und Legal Review erforderlich (§4.1, §9.4.2).",
    );
  }

  if (act.lifecycleState === "needs_legal_review") {
    needsLegalReview = true;
    reasons.push(
      "Der Rechtsakt steht im Lifecycle-Zustand needs_legal_review — finale Aussagen sind blockiert (§7.2.1).",
    );
  }

  if (act.lifecycleState === "superseded" || act.lifecycleState === "repealed") {
    applicable = false;
    reasons.push(
      `Der Rechtsakt ist ${act.lifecycleState}; aktive Pflichtaufgaben sind deaktiviert (§7.2.7).`,
    );
  }

  return {
    id: options.id ?? assessmentId(act, profile, assessedAt),
    legalActId: act.id,
    projectProfileId: profile.id,
    applicable,
    confidence,
    reasons,
    needsLegalReview,
    assessedAt,
    ...(options.review !== undefined
      ? { reviewedBy: options.review.reviewedBy, reviewedAt: options.review.reviewedAt }
      : {}),
  };
}

/** Bewertet alle Rechtsakte eines Datensatzes gegen ein Profil. */
export function assessAll(
  dataset: Pick<RegulatoryDataset, "legalActs">,
  profile: ProjectProfile,
  options: AssessOptions = {},
): ApplicabilityAssessment[] {
  return dataset.legalActs.map((act) => assessApplicability(act, profile, options));
}

/**
 * §6.6 Aktualitätsregel (F-13).
 *
 * Gültig ist das Assessment mit dem jüngsten `assessedAt`, dessen
 * `supersededBy` leer ist. Bei identischem `assessedAt` entscheidet die
 * lexikografisch größere id — rein damit das Ergebnis deterministisch bleibt.
 */
export function currentAssessment(
  assessments: readonly ApplicabilityAssessment[],
  legalActId: string,
  projectProfileId: string,
): ApplicabilityAssessment | undefined {
  const candidates = assessments.filter(
    (a) =>
      a.legalActId === legalActId &&
      a.projectProfileId === projectProfileId &&
      a.supersededBy === undefined,
  );
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, candidate) => {
    if (candidate.assessedAt > best.assessedAt) return candidate;
    if (candidate.assessedAt === best.assessedAt && candidate.id > best.id) return candidate;
    return best;
  });
}

/**
 * SPEC v2 §8.4 — Ableitungstabelle `ApplicabilityAssessment` →
 * `RoadmapItem.applicability` (F-03). Erste zutreffende Zeile gewinnt;
 * `needsLegalReview` hat immer Vorrang.
 */
export function deriveApplicabilityLabel(
  assessment: Pick<ApplicabilityAssessment, "applicable" | "confidence" | "needsLegalReview">,
): ApplicabilityLabel {
  if (assessment.needsLegalReview) return "needs_legal_review";
  if (assessment.applicable && (assessment.confidence === "high" || assessment.confidence === "medium")) {
    return "applicable";
  }
  if (assessment.applicable && assessment.confidence === "low") return "possibly_applicable";
  return "not_applicable";
}

/**
 * Interpretationsregel zu §9.3 (siehe docs/interpretation-notes.md, IN-02).
 *
 * §9.3 setzt für jede Priorität oberhalb von `low` voraus, dass
 * `applicability ∈ {applicable, possibly_applicable}` ist, verlangt aber
 * gleichzeitig, dass ein `needs_legal_review`-Item eine normal ermittelte
 * Priorität behält. Aufgelöst wird das über das darunterliegende Assessment:
 * für die Vorbedingung wird `needsLegalReview` ausgeblendet und nur
 * `applicable`/`confidence` ausgewertet.
 */
export function effectiveApplicabilityForPrioritisation(
  assessment: Pick<ApplicabilityAssessment, "applicable" | "confidence" | "needsLegalReview">,
): ApplicabilityLabel {
  return deriveApplicabilityLabel({ ...assessment, needsLegalReview: false });
}
