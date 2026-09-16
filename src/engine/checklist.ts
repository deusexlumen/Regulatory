/**
 * SPEC v2 §10 — Checklist-Generator.
 *
 * Erzeugt prüfbare technische und organisatorische Checklisten pro Regulierung
 * und Projektprofil. Der Zustand eines Punktes wird aus dem Datenmodell
 * abgeleitet (Control-Implementierungsstatus §7.4 bzw. LegalTextSlot-Status),
 * nie frei gesetzt.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import type { LegalActSlug } from "../domain/slugs.js";
import { SLOT_KEYS } from "../domain/slugs.js";
import type {
  ApplicabilityAssessment,
  Checklist,
  ChecklistItem,
  LegalAct,
} from "../domain/types.js";
import { toChecklistState } from "../state/control-implementation.js";
import { currentAssessment, deriveApplicabilityLabel } from "./applicability.js";
import { isSlotReleaseCompliant } from "./roadmap.js";
import { CONTROL } from "../data/ids.js";

interface ChecklistTemplateItem {
  key: string;
  title: string;
  description?: string;
  category: ChecklistItem["category"];
  requiresLegalText: boolean;
  requiresEvidence: boolean;
  needsLegalReview: boolean;
  /** Zustandsquelle: eine Kontrolle … */
  controlId?: string;
  /** … oder ein Rechtstext-Slot … */
  slotKey?: string;
  /** … oder die Konsistenz des Unsicherheits-Flags (§10.5, letzter Punkt). */
  derivesFromAssessmentFlag?: true;
}

const BFSG_TEMPLATE: ChecklistTemplateItem[] = [
  {
    key: "layout-structure",
    title: "Accessibility-Struktur im Layout vorhanden",
    description: "Landmarks, semantische Struktur und Skip-Links sind im Layout angelegt.",
    category: "accessibility",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yStructure,
  },
  {
    key: "footer-slot",
    title: "Footer-Slot für AccessibilityStatement vorhanden",
    category: "architecture",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: false,
    controlId: CONTROL.bfsgStatementSlot,
  },
  {
    key: "feedback-mechanism",
    title: "Feedback- oder Kontaktmechanismus vorbereitet",
    category: "accessibility",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgFeedbackChannel,
  },
  {
    key: "alternative-access",
    title: "Alternativzugänge berücksichtigt",
    description: "Alternative Zugangswege zu Kernfunktionen sind konzipiert und dokumentiert.",
    category: "accessibility",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yStructure,
  },
  {
    key: "contrast",
    title: "Farbkontraste prüfbar",
    category: "testing",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yTestSetup,
  },
  {
    key: "keyboard",
    title: "Tastaturbedienung prüfbar",
    category: "testing",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yTestSetup,
  },
  {
    key: "form-labels",
    title: "Formular-Labels vorhanden",
    category: "accessibility",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yStructure,
  },
  {
    key: "focus-states",
    title: "Fokus-States vorhanden",
    category: "accessibility",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yStructure,
  },
  {
    key: "heading-structure",
    title: "Semantische Überschriftenstruktur vorhanden",
    category: "accessibility",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yStructure,
  },
  {
    key: "media-alternatives",
    title: "Media-Alternativen vorbereitet",
    description: "Untertitel, Transkripte und Textalternativen sind als Struktur vorgesehen.",
    category: "content",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgMediaAlternatives,
  },
  {
    key: "test-setup",
    title: "Accessibility-Test-Setup vorhanden",
    category: "testing",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.bfsgA11yTestSetup,
  },
  {
    key: "slot-not-selffilled",
    title: "Rechtstext-Slot nicht eigenmächtig befüllt",
    description:
      "Der Slot ist leer oder trägt einen freigegebenen Text aus Generator, Kanzlei, offizieller Quelle " +
      "oder interner Freigabe (§12.1–§12.3).",
    category: "content",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: true,
    slotKey: SLOT_KEYS.bfsgAccessibilityStatement,
  },
];

const AI_ACT_TEMPLATE: ChecklistTemplateItem[] = [
  {
    key: "ai-inventory",
    title: "KI-Funktion inventarisiert",
    category: "documentation",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.aiSystemInventory,
  },
  {
    key: "profile-flags",
    title: "KI-Einsatz im Projektprofil erfasst",
    description: "hasAiChatbot / hasAiGeneratedContent / hasAutomatedDecisions sind gepflegt.",
    category: "documentation",
    requiresLegalText: false,
    requiresEvidence: false,
    needsLegalReview: false,
    controlId: CONTROL.aiSystemInventory,
  },
  {
    key: "chatbot-labelling",
    title: "Chatbot-Kennzeichnung vorbereitet",
    category: "ai_transparency",
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.aiPreInteractionNotice,
  },
  {
    key: "synthetic-content",
    title: "Hinweis auf synthetische Inhalte vorbereitet",
    category: "ai_transparency",
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.aiContentMarking,
  },
  {
    key: "contextual-disclosure",
    title: "Kontextuelle Disclosure-Komponente vorbereitet",
    category: "ai_transparency",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: false,
    controlId: CONTROL.aiDisclosureSlot,
  },
  {
    key: "system-description-slot",
    title: "Systembeschreibung als Slot vorhanden",
    category: "architecture",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: false,
    controlId: CONTROL.aiDisclosureSlot,
  },
  {
    key: "pre-interaction-notice",
    title: "Nutzerhinweis vor Interaktion vorbereitet",
    category: "ai_transparency",
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.aiPreInteractionNotice,
  },
  {
    key: "logging",
    title: "Logging- oder Nachweisstruktur vorbereitet",
    category: "documentation",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.aiInteractionLog,
  },
  {
    key: "slot-not-selffilled",
    title: "Rechtstext-Slot nicht eigenmächtig befüllt",
    category: "content",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: true,
    slotKey: SLOT_KEYS.aiActDisclosureNotice,
  },
];

const DATA_ACT_TEMPLATE: ChecklistTemplateItem[] = [
  {
    key: "data-categories",
    title: "Relevante Datenkategorien identifiziert",
    category: "data_transparency",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.dataFlowDocumentation,
  },
  {
    key: "iot-scope",
    title: "IoT-Bezug geprüft",
    category: "data_transparency",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
    controlId: CONTROL.dataFlowDocumentation,
  },
  {
    key: "user-data-scope",
    title: "Nutzerdaten-Bezug geprüft",
    category: "data_transparency",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.dataFlowDocumentation,
  },
  {
    key: "access-duties",
    title: "Datenzugriffspflichten geprüft",
    category: "data_transparency",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
    controlId: CONTROL.dataAccessExport,
  },
  {
    key: "transparency-notice",
    title: "Transparenzhinweise vorbereitet",
    category: "data_transparency",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: false,
    controlId: CONTROL.dataTransparencySlot,
  },
  {
    key: "portability",
    title: "Datenportabilität geprüft",
    category: "architecture",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.dataAccessExport,
  },
  {
    key: "third-party-sharing",
    title: "Third-Party-Sharing geprüft",
    category: "data_transparency",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
    controlId: CONTROL.dataSharingRegister,
  },
  {
    key: "dataflow-docs",
    title: "Dokumentation der Datenflüsse vorbereitet",
    category: "documentation",
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: false,
    controlId: CONTROL.dataFlowDocumentation,
  },
  {
    key: "slot-not-selffilled",
    title: "Rechtstext-Slot nicht eigenmächtig befüllt",
    category: "content",
    requiresLegalText: true,
    requiresEvidence: false,
    needsLegalReview: true,
    slotKey: SLOT_KEYS.dataActTransparencyNotice,
  },
  {
    key: "uncertainty-flag",
    title: "Needs-Legal-Review-Flag bei Unsicherheit gesetzt",
    description:
      "Bei confidence:\"low\" muss das gültige ApplicabilityAssessment needsLegalReview:true tragen (§8.3 Regel 4/5).",
    category: "legal_review",
    requiresLegalText: false,
    requiresEvidence: false,
    needsLegalReview: true,
    derivesFromAssessmentFlag: true,
  },
];

const TEMPLATES: Record<LegalActSlug, ChecklistTemplateItem[]> = {
  BFSG: BFSG_TEMPLATE,
  EU_AI_ACT: AI_ACT_TEMPLATE,
  EU_DATA_ACT: DATA_ACT_TEMPLATE,
};

const CHECKLIST_TITLES: Record<LegalActSlug, string> = {
  BFSG: "BFSG Checklist",
  EU_AI_ACT: "AI Act Checklist",
  EU_DATA_ACT: "Data Act Checklist",
};

function deriveState(
  dataset: RegulatoryDataset,
  template: ChecklistTemplateItem,
  assessment: ApplicabilityAssessment | undefined,
): ChecklistItem["state"] {
  if (template.controlId !== undefined) {
    const control = dataset.complianceControls.find((c) => c.id === template.controlId);
    return control === undefined ? "not_started" : toChecklistState(control.implementationState);
  }
  if (template.slotKey !== undefined) {
    const slot = dataset.legalTextSlots.find((s) => s.slotKey === template.slotKey);
    if (slot === undefined) return "not_started";
    if (isSlotReleaseCompliant(slot)) return "done";
    switch (slot.status) {
      case "approved":
        // status approved, aber Invariante verletzt (§12.3) — nicht "done".
        return "needs_review";
      case "needs_review":
        return "needs_review";
      case "draft":
        return "in_progress";
      case "empty":
        return "not_started";
    }
  }
  if (template.derivesFromAssessmentFlag === true) {
    if (assessment === undefined) return "not_started";
    const consistent = assessment.confidence !== "low" || assessment.needsLegalReview;
    return consistent ? "done" : "needs_review";
  }
  return "not_started";
}

export interface ChecklistOptions {
  /** Nur die Punkte einer Kategorie erzeugen. */
  category?: ChecklistItem["category"];
}

/**
 * Erzeugt die Checkliste eines Rechtsakts für ein Projektprofil.
 *
 * §8.3 Regel 6: Ist die Regulierung für das Profil nicht anwendbar, werden
 * keine Pflichtpunkte erzeugt; die Checkliste wird mit `skippedReason`
 * zurückgegeben, damit die Nichtanwendbarkeit sichtbar bleibt statt zu fehlen.
 */
export function generateChecklist(
  dataset: RegulatoryDataset,
  act: LegalAct,
  projectProfileId: string,
  options: ChecklistOptions = {},
): Checklist {
  const checklistId = `checklist-${act.slug.toLowerCase()}-${projectProfileId}`;
  const assessment = currentAssessment(
    dataset.applicabilityAssessments,
    act.id,
    projectProfileId,
  );
  const base = {
    id: checklistId,
    legalActId: act.id,
    legalActSlug: act.slug,
    projectProfileId,
    title: CHECKLIST_TITLES[act.slug],
  };

  if (assessment === undefined) {
    return {
      ...base,
      items: [],
      skippedReason:
        "Kein gültiges ApplicabilityAssessment für dieses Profil — Anwendbarkeit zuerst bewerten (§8).",
    };
  }

  const label = deriveApplicabilityLabel(assessment);
  if (label === "not_applicable") {
    return {
      ...base,
      items: [],
      skippedReason: `Nicht anwendbar für dieses Profil (§8.3 Regel 6): ${assessment.reasons.join(" ")}`,
    };
  }

  const templates = (TEMPLATES[act.slug] ?? []).filter(
    (t) => options.category === undefined || t.category === options.category,
  );

  const items = templates.map<ChecklistItem>((template) => ({
    id: `${checklistId}-${template.key}`,
    checklistId,
    regulationId: act.id,
    projectProfileId,
    title: template.title,
    ...(template.description !== undefined ? { description: template.description } : {}),
    category: template.category,
    state: deriveState(dataset, template, assessment),
    requiresLegalText: template.requiresLegalText,
    requiresEvidence: template.requiresEvidence,
    // §8.3 Regel 4: eine unsichere Bewertung schlägt auf jeden Punkt durch.
    needsLegalReview: template.needsLegalReview || assessment.needsLegalReview,
  }));

  return { ...base, items };
}

/** §15.3 — alle drei Checklisten für ein Profil. */
export function generateAllChecklists(
  dataset: RegulatoryDataset,
  projectProfileId: string,
  options: ChecklistOptions = {},
): Checklist[] {
  return dataset.legalActs.map((act) => generateChecklist(dataset, act, projectProfileId, options));
}
