/**
 * SPEC v2 §16 Schritt 3/4 — SourceRecords und Seed-Daten für BFSG, AI Act und
 * Data Act.
 *
 * ## Gegenprüfung der Arbeitsstand-Daten aus §5
 *
 * §16 Schritt 4 verlangt eine Gegenprüfung der in §5 dokumentierten
 * Arbeitsstand-Angaben gegen Primärquellen. Sie wurde durchgeführt und ist in
 * `docs/source-verification.md` protokolliert. Ergebnis in Kurzform:
 *
 * - §5.1 BFSG: bestätigt (Verkündung BGBl. I 2021 S. 2970, Inkrafttreten
 *   28.06.2025; § 38 BFSG enthält Übergangsbestimmungen ausschließlich für vor
 *   dem 28.06.2025 rechtmäßig eingesetzte Produkte und Bestandsverträge bis
 *   längstens 27.06.2030 — für Neuprojekte besteht keine Übergangsfrist).
 * - §5.2 EU AI Act: **korrigiert**. Die Angabe "Transparenzpflichten nach
 *   Art. 50 greifen seit August 2025" ist nicht zutreffend; Art. 50 gilt nach
 *   Art. 113 ab dem 02.08.2026. Seit dem 02.08.2025 gelten die Pflichten für
 *   GPAI-Modelle, nicht Art. 50. Der Seed trägt das korrigierte Datum, die
 *   Abweichung ist im Open-Questions-Report ausgewiesen und der Rechtsakt steht
 *   auf `reviewStatus: "needs_legal_review"`.
 * - §5.3 EU Data Act: bestätigt (Geltungsbeginn 12.09.2025 nach Art. 50;
 *   ergänzend: Art. 3 Abs. 1 greift für vernetzte Produkte, die ab dem
 *   12.09.2026 in Verkehr gebracht werden).
 *
 * Einschränkung, die in jedem SourceRecord vermerkt ist: Der direkte Abruf der
 * Primärtexte (EUR-Lex, gesetze-im-internet.de) war in der Erstellungsumgebung
 * durch die Netzwerk-Policy blockiert. Die Gegenprüfung erfolgte über
 * Sekundärrecherche auf die jeweiligen amtlichen Fundstellen. Die
 * SourceRecords tragen deshalb `confidence: "medium"`; die Direktprüfung am
 * Primärtext ist offen und im Open-Questions-Report gelistet.
 */
import type { RegulatoryDataset } from "../domain/dataset.js";
import { emptyDataset } from "../domain/dataset.js";
import { RegulatoryStore } from "../audit/store.js";
import { SLOT_KEYS } from "../domain/slugs.js";
import type { Clock } from "../time/clock.js";
import { fixedClock } from "../time/clock.js";
import { assessApplicability } from "../engine/applicability.js";
import { ACT, CONTROL, OBLIGATION, PROFILE, SLOT } from "./ids.js";
import { projectProfiles } from "./project-profiles.js";

/** Basiszeitpunkt des Seeds — hält Seed-Daten und Audit-Trail reproduzierbar. */
export const SEED_DATE = "2026-09-16";
export const SEED_CLOCK: Clock = fixedClock(SEED_DATE, `${SEED_DATE}T09:00:00.000Z`);

const NOT_DIRECTLY_RETRIEVED =
  "Gegenprüfung über Sekundärrecherche auf die amtliche Fundstelle; direkter Abruf des Primärtexts " +
  "in der Erstellungsumgebung durch Netzwerk-Policy blockiert. Direktprüfung offen.";

const SRC = {
  bfsgDirective: "src-bfsg-eu-dir-2019-882",
  bfsgBgbl: "src-bfsg-bgbl-2021-2970",
  aiActRegulation: "src-eu-ai-act-reg-2024-1689",
  dataActRegulation: "src-eu-data-act-reg-2023-2854",
} as const;

/**
 * Baut den vollständigen Seed-Datensatz über den `RegulatoryStore`, damit jede
 * Entität einen AuditEntry erhält (§14.1) — insbesondere `source_record` und
 * `applicability_assessment` (F-05).
 */
export function buildSeedDataset(clock: Clock = SEED_CLOCK): RegulatoryDataset {
  const store = new RegulatoryStore({ dataset: emptyDataset(), clock, defaultActor: "agent" });

  // ------------------------------------------------------------- Profile ----
  for (const profile of projectProfiles) {
    store.addProjectProfile(profile, { reason: "Projektprofil aus Annahmen (§16 Schritt 1)." });
  }

  // -------------------------------------------------------- SourceRecords ---
  store.addSourceRecord({
    id: SRC.bfsgDirective,
    sourceSystem: "EUR-Lex",
    documentType: "directive",
    officialIdentifier: "Richtlinie (EU) 2019/882",
    title:
      "Richtlinie (EU) 2019/882 über die Barrierefreiheitsanforderungen für Produkte und Dienstleistungen",
    url: "https://eur-lex.europa.eu/eli/dir/2019/882/oj",
    publicationDate: "2019-06-07",
    retrievedAt: SEED_DATE,
    confidence: "medium",
    notes: NOT_DIRECTLY_RETRIEVED,
  });
  store.addSourceRecord({
    id: SRC.bfsgBgbl,
    sourceSystem: "BGBl",
    documentType: "official_publication",
    officialIdentifier: "BGBl. I 2021 S. 2970",
    title:
      "Gesetz zur Umsetzung der Richtlinie (EU) 2019/882 (Barrierefreiheitsstärkungsgesetz — BFSG), " +
      "verkündet am 16.07.2021",
    url: "https://www.gesetze-im-internet.de/bfsg/",
    publicationDate: "2021-07-16",
    retrievedAt: SEED_DATE,
    confidence: "medium",
    notes:
      `${NOT_DIRECTLY_RETRIEVED} Geprüfte Angaben: Inkrafttreten 28.06.2025; § 38 BFSG ` +
      "Übergangsbestimmungen nur für Bestandsprodukte/-verträge bis längstens 27.06.2030 sowie " +
      "Selbstbedienungsterminals bis zu 15 Jahre.",
  });
  store.addSourceRecord({
    id: SRC.aiActRegulation,
    sourceSystem: "EUR-Lex",
    documentType: "regulation",
    officialIdentifier: "Verordnung (EU) 2024/1689",
    title: "Verordnung (EU) 2024/1689 zur Festlegung harmonisierter Vorschriften für künstliche Intelligenz",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    publicationDate: "2024-07-12",
    retrievedAt: SEED_DATE,
    confidence: "medium",
    notes:
      `${NOT_DIRECTLY_RETRIEVED} Geprüfte Angaben: Inkrafttreten 01.08.2024; gestaffelte Anwendbarkeit ` +
      "nach Art. 113; Art. 50 (Transparenzpflichten) ab 02.08.2026. Die Angabe aus SPEC §5.2 " +
      "(\"Art. 50 seit August 2025\") wurde dadurch nicht bestätigt.",
  });
  store.addSourceRecord({
    id: SRC.dataActRegulation,
    sourceSystem: "EUR-Lex",
    documentType: "regulation",
    officialIdentifier: "Verordnung (EU) 2023/2854",
    title: "Verordnung (EU) 2023/2854 über harmonisierte Vorschriften für einen fairen Datenzugang und eine faire Datennutzung (Data Act)",
    url: "https://eur-lex.europa.eu/eli/reg/2023/2854/oj",
    publicationDate: "2023-12-22",
    retrievedAt: SEED_DATE,
    confidence: "medium",
    notes:
      `${NOT_DIRECTLY_RETRIEVED} Geprüfte Angaben: Inkrafttreten 11.01.2024; Geltungsbeginn 12.09.2025 ` +
      "nach Art. 50; Art. 3 Abs. 1 für ab dem 12.09.2026 in Verkehr gebrachte vernetzte Produkte.",
  });

  // ------------------------------------------------------------ LegalActs ---
  store.addLegalAct({
    id: ACT.bfsg,
    slug: "BFSG",
    name: "Barrierefreiheitsstärkungsgesetz",
    shortName: "BFSG",
    jurisdiction: "EU+DE",
    legalBasis: "Umsetzung der Richtlinie (EU) 2019/882",
    sourceRecords: [SRC.bfsgBgbl, SRC.bfsgDirective],
    lifecycleState: "applicable",
    effectiveDate: "2025-06-28",
    applicableDate: "2025-06-28",
    transitionPeriod:
      "§ 38 BFSG: Übergangsbestimmungen ausschließlich für vor dem 28.06.2025 rechtmäßig eingesetzte " +
      "Produkte und Bestandsverträge (längstens bis 27.06.2030) sowie Selbstbedienungsterminals " +
      "(bis zu 15 Jahre). Für Neuprojekte besteht keine Übergangsfrist — deshalb ist kein " +
      "transitionEnd gesetzt (§9.5.3).",
    reviewStatus: "draft",
    summary:
      "Barrierefreiheitsanforderungen an Produkte und Dienstleistungen, für Webprojekte insbesondere " +
      "an elektronischen Geschäftsverkehr und Dienstleistungswebsites.",
  });

  store.addLegalAct({
    id: ACT.aiAct,
    slug: "EU_AI_ACT",
    name: "Verordnung (EU) 2024/1689 über künstliche Intelligenz",
    shortName: "AI Act",
    jurisdiction: "EU",
    legalBasis: "Verordnung (EU) 2024/1689",
    sourceRecords: [SRC.aiActRegulation],
    lifecycleState: "applicable",
    effectiveDate: "2024-08-01",
    applicableDate: "2026-08-02",
    transitionPeriod:
      "Gestaffelte Anwendbarkeit nach Art. 113. Für dieses Modul maßgeblich: Art. 50 " +
      "(Transparenzpflichten) ab 02.08.2026. Weitere Stufen betreffen Hochrisiko-Kategorien und sind " +
      "für ein Webprojekt ohne Hochrisiko-System nicht einschlägig — daher kein transitionEnd (§9.5.3).",
    reviewStatus: "needs_legal_review",
    summary:
      "Transparenzpflichten für KI-Interaktion und synthetische Inhalte. ACHTUNG: Die Arbeitsstand-" +
      "Angabe aus SPEC §5.2 (Art. 50 seit August 2025) wurde durch die Gegenprüfung nicht bestätigt.",
  });

  store.addLegalAct({
    id: ACT.dataAct,
    slug: "EU_DATA_ACT",
    name: "Verordnung (EU) 2023/2854 über fairen Datenzugang und faire Datennutzung",
    shortName: "Data Act",
    jurisdiction: "EU",
    legalBasis: "Verordnung (EU) 2023/2854",
    sourceRecords: [SRC.dataActRegulation],
    lifecycleState: "applicable",
    effectiveDate: "2024-01-11",
    applicableDate: "2025-09-12",
    transitionEnd: "2026-09-12",
    transitionPeriod:
      "Geltungsbeginn 12.09.2025. Art. 3 Abs. 1 (Access by Design) greift für vernetzte Produkte, " +
      "die ab dem 12.09.2026 in Verkehr gebracht werden — dieses Datum ist als transitionEnd gesetzt.",
    reviewStatus: "draft",
    summary:
      "Datenzugangs-, Portabilitäts- und Transparenzpflichten. Reichweite für Webprojekte ohne " +
      "vernetztes Produkt ist auslegungsbedürftig.",
  });

  // ---------------------------------------------------------- Obligations ---
  store.addObligation({
    id: OBLIGATION.bfsgStatement,
    legalActId: ACT.bfsg,
    title: "Informationen zur Barrierefreiheit öffentlich zugänglich bereitstellen",
    description:
      "Der Dienstleistungserbringer muss die Informationen nach Anlage 3 Nr. 1 BFSG erstellen und in " +
      "barrierefreier Form öffentlich zugänglich machen (in der Praxis: Barrierefreiheitserklärung, " +
      "typischerweise über den Footer erreichbar).",
    normReference: "§ 14 Abs. 1 Nr. 2 BFSG i. V. m. Anlage 3 Nr. 1 BFSG",
    sourceRecords: [SRC.bfsgBgbl],
    affectedLayers: ["frontend", "content", "legal"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: false,
  });
  store.addObligation({
    id: OBLIGATION.bfsgConformance,
    legalActId: ACT.bfsg,
    title: "Barrierefreiheitsanforderungen an die Dienstleistung technisch erfüllen",
    description:
      "Wahrnehmbarkeit, Bedienbarkeit, Verständlichkeit und Robustheit der digitalen Dienstleistung. " +
      "Die Konkretisierung erfolgt über die BFSGV und die harmonisierten Normen; die genaue " +
      "Konformitätsstufe (Arbeitsstand §5.1: WCAG 2.1 AA) ist rechtlich zu bestätigen.",
    normReference: "§ 3 BFSG i. V. m. BFSGV",
    sourceRecords: [SRC.bfsgBgbl, SRC.bfsgDirective],
    affectedLayers: ["frontend", "content"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
  });
  store.addObligation({
    id: OBLIGATION.bfsgFeedback,
    legalActId: ACT.bfsg,
    title: "Feedback- und Kontaktmechanismus zur Barrierefreiheit bereitstellen",
    description:
      "Rückmeldemöglichkeit zu Barrieren und alternative Zugangswege. Die genaue Ausgestaltung und " +
      "die Verortung der Pflicht sind zu bestätigen.",
    normReference: "Richtlinie (EU) 2019/882, Anhang I Abschnitt III (Umsetzung über BFSG/BFSGV)",
    sourceRecords: [SRC.bfsgDirective],
    affectedLayers: ["frontend", "operations"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
  });

  store.addObligation({
    id: OBLIGATION.aiInteractionDisclosure,
    legalActId: ACT.aiAct,
    title: "Offenlegung der KI-Interaktion gegenüber natürlichen Personen",
    description:
      "Nutzerinnen und Nutzer müssen erkennen können, dass sie mit einem KI-System interagieren — " +
      "rechtzeitig, deutlich und vor der Interaktion.",
    normReference: "Art. 50 Abs. 1 VO (EU) 2024/1689",
    sourceRecords: [SRC.aiActRegulation],
    affectedLayers: ["frontend", "content", "legal"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: false,
  });
  store.addObligation({
    id: OBLIGATION.aiSyntheticContent,
    legalActId: ACT.aiAct,
    title: "Kennzeichnung synthetisch erzeugter Inhalte",
    description:
      "Maschinenlesbare Markierung und wahrnehmbare Kennzeichnung KI-generierter Inhalte.",
    normReference: "Art. 50 Abs. 2 und Abs. 4 VO (EU) 2024/1689",
    sourceRecords: [SRC.aiActRegulation],
    affectedLayers: ["frontend", "backend", "content"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: false,
  });
  store.addObligation({
    id: OBLIGATION.aiSystemInventory,
    legalActId: ACT.aiAct,
    title: "KI-Systeminventar und Nachvollziehbarkeit vorbereiten",
    description:
      "Vorbereitungsmaßnahme ohne eigenständige Norm: ohne Inventar der eingesetzten KI-Funktionen " +
      "ist weder die Rollenzuordnung (Anbieter/Betreiber) noch der Pflichtenumfang bestimmbar.",
    normReference: "Vorbereitungsmaßnahme zu Art. 50 VO (EU) 2024/1689 — keine eigenständige Norm",
    sourceRecords: [SRC.aiActRegulation],
    affectedLayers: ["backend", "operations", "legal"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
  });

  store.addObligation({
    id: OBLIGATION.dataTransparency,
    legalActId: ACT.dataAct,
    title: "Transparenz über Datenerhebung, Datenspeicherung und Datenzugriff",
    description:
      "Informationen darüber, welche Daten erzeugt, gespeichert und zugänglich gemacht werden. Für " +
      "Projekte ohne vernetztes Produkt ist die Reichweite auslegungsbedürftig.",
    normReference: "Art. 3 Abs. 2 VO (EU) 2023/2854",
    sourceRecords: [SRC.dataActRegulation],
    affectedLayers: ["frontend", "content", "data", "legal"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: true,
    requiresEvidence: true,
    needsLegalReview: true,
  });
  store.addObligation({
    id: OBLIGATION.dataAccessPortability,
    legalActId: ACT.dataAct,
    title: "Datenzugang und Datenportabilität ermöglichen",
    description:
      "Zugriff auf und Übertragbarkeit von Nutzungsdaten in einem strukturierten, gängigen und " +
      "maschinenlesbaren Format.",
    normReference: "Art. 4 und Art. 5 VO (EU) 2023/2854",
    sourceRecords: [SRC.dataActRegulation],
    affectedLayers: ["backend", "data"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
  });
  store.addObligation({
    id: OBLIGATION.dataThirdPartySharing,
    legalActId: ACT.dataAct,
    title: "Weitergabe an Dritte dokumentieren und steuern",
    description: "Register der Datenempfänger, Zwecke und Rechtsgrundlagen der Weitergabe.",
    normReference: "Art. 5 und Art. 6 VO (EU) 2023/2854",
    sourceRecords: [SRC.dataActRegulation],
    affectedLayers: ["backend", "data", "operations"],
    lifecycleState: "applicable",
    actionableNow: true,
    prepareArchitectureOnly: false,
    requiresLegalText: false,
    requiresEvidence: true,
    needsLegalReview: true,
  });

  // ----------------------------------------------------- ComplianceControls -
  store.addControl({
    id: CONTROL.bfsgStatementSlot,
    obligationId: OBLIGATION.bfsgStatement,
    title: "Footer-Slot AccessibilityStatement (View auf LegalTextSlot)",
    controlType: "ui_component",
    targetModule: "src/ui/slots.tsx#AccessibilityStatementSlot",
    implementationState: "prepared",
    dependsOnPublication: false,
    dependsOnLegalText: true,
    ownerRole: "frontend",
    notes: "Rendert ausschließlich über LegalTextRenderer; kein eigener Status (§11.1).",
  });
  store.addControl({
    id: CONTROL.bfsgA11yStructure,
    obligationId: OBLIGATION.bfsgConformance,
    title: "Semantische Struktur, Fokus-Management und Formular-Labels",
    controlType: "accessibility_structure",
    targetModule: "src/ui",
    implementationState: "in_progress",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "frontend",
  });
  store.addControl({
    id: CONTROL.bfsgA11yTestSetup,
    obligationId: OBLIGATION.bfsgConformance,
    title: "Accessibility-Test-Setup (axe-core, Fokusreihenfolge, Tastatur)",
    controlType: "test",
    targetModule: "tests/accessibility.test.tsx",
    implementationState: "prepared",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "frontend",
  });
  store.addControl({
    id: CONTROL.bfsgMediaAlternatives,
    obligationId: OBLIGATION.bfsgConformance,
    title: "Media-Alternativen (Untertitel, Transkripte, Textalternativen)",
    controlType: "workflow",
    targetModule: "content-pipeline",
    implementationState: "not_started",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "content",
  });
  store.addControl({
    id: CONTROL.bfsgFeedbackChannel,
    obligationId: OBLIGATION.bfsgFeedback,
    title: "Feedback- und Kontaktmechanismus zur Barrierefreiheit",
    controlType: "ui_component",
    targetModule: "src/ui/slots.tsx#AccessibilityStatementSlot",
    implementationState: "not_started",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "frontend",
  });

  store.addControl({
    id: CONTROL.aiDisclosureSlot,
    obligationId: OBLIGATION.aiInteractionDisclosure,
    title: "Disclosure-Slot für KI-Hinweis (View auf LegalTextSlot)",
    controlType: "ui_component",
    targetModule: "src/ui/slots.tsx#AiDisclosureNotice",
    implementationState: "prepared",
    dependsOnPublication: false,
    dependsOnLegalText: true,
    ownerRole: "frontend",
  });
  store.addControl({
    id: CONTROL.aiPreInteractionNotice,
    obligationId: OBLIGATION.aiInteractionDisclosure,
    title: "Vorinteraktiver Hinweis im Chat-Einstieg",
    controlType: "disclosure_notice",
    targetModule: "src/ui/slots.tsx#AiDisclosureNotice",
    implementationState: "not_started",
    dependsOnPublication: false,
    dependsOnLegalText: true,
    ownerRole: "frontend",
  });
  store.addControl({
    id: CONTROL.aiContentMarking,
    obligationId: OBLIGATION.aiSyntheticContent,
    title: "Kennzeichnung synthetischer Inhalte (wahrnehmbar und maschinenlesbar)",
    controlType: "disclosure_notice",
    targetModule: "content-pipeline",
    implementationState: "not_started",
    dependsOnPublication: false,
    dependsOnLegalText: true,
    ownerRole: "frontend",
  });
  store.addControl({
    id: CONTROL.aiSystemInventory,
    obligationId: OBLIGATION.aiSystemInventory,
    title: "Inventar der eingesetzten KI-Funktionen",
    controlType: "documentation",
    targetModule: "docs/ai-inventory.md",
    implementationState: "in_progress",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "compliance",
  });
  store.addControl({
    id: CONTROL.aiInteractionLog,
    obligationId: OBLIGATION.aiSystemInventory,
    title: "Logging der KI-Interaktionen als Nachweisstruktur",
    controlType: "audit_log",
    targetModule: "backend/logging",
    implementationState: "not_started",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "backend",
  });

  store.addControl({
    id: CONTROL.dataTransparencySlot,
    obligationId: OBLIGATION.dataTransparency,
    title: "Transparenz-Slot Datennutzung (View auf LegalTextSlot)",
    controlType: "ui_component",
    targetModule: "src/ui/slots.tsx#DataTransparencyNotice",
    implementationState: "prepared",
    dependsOnPublication: false,
    dependsOnLegalText: true,
    ownerRole: "frontend",
  });
  store.addControl({
    id: CONTROL.dataFlowDocumentation,
    obligationId: OBLIGATION.dataTransparency,
    title: "Datenflussdokumentation (Kategorien, Speicherorte, Empfänger)",
    controlType: "documentation",
    targetModule: "docs/data-flows.md",
    implementationState: "in_progress",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "data",
  });
  store.addControl({
    id: CONTROL.dataAccessExport,
    obligationId: OBLIGATION.dataAccessPortability,
    title: "Datenzugriff und Export in maschinenlesbarem Format",
    controlType: "workflow",
    targetModule: "backend/export",
    implementationState: "not_started",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "backend",
  });
  store.addControl({
    id: CONTROL.dataSharingRegister,
    obligationId: OBLIGATION.dataThirdPartySharing,
    title: "Register der Third-Party-Datenweitergaben",
    controlType: "data_transparency",
    targetModule: "backend/data-sharing",
    implementationState: "blocked",
    dependsOnPublication: false,
    dependsOnLegalText: false,
    ownerRole: "data",
    notes:
      "Blockiert: Empfängerliste und Zweckbindung sind ohne abgeschlossene Datenflussdokumentation " +
      "nicht bestimmbar.",
  });

  // ------------------------------------------------- ImplementationTasks ----
  const bfsgSources = [SRC.bfsgBgbl, SRC.bfsgDirective];
  store.addTask({
    id: "task-bfsg-statement-slot",
    complianceControlId: CONTROL.bfsgStatementSlot,
    title: "Footer-Slot anlegen und Platzhalter maschinenlesbar markieren",
    priority: "high",
    state: "update_legal_text",
    legalSourceIds: bfsgSources,
    needsLegalReview: true,
    outputArtifacts: ["src/ui/slots.tsx"],
  });
  store.addTask({
    id: "task-bfsg-a11y-structure",
    complianceControlId: CONTROL.bfsgA11yStructure,
    title: "Landmarks, Überschriftenhierarchie, Fokus-States und Labels umsetzen",
    priority: "high",
    state: "implement",
    legalSourceIds: bfsgSources,
    needsLegalReview: false,
  });
  store.addTask({
    id: "task-bfsg-a11y-tests",
    complianceControlId: CONTROL.bfsgA11yTestSetup,
    title: "axe-core-Baseline, Fokusreihenfolge- und Tastaturtests einrichten",
    priority: "high",
    state: "test",
    legalSourceIds: bfsgSources,
    needsLegalReview: false,
    outputArtifacts: ["tests/accessibility.test.tsx"],
  });
  store.addTask({
    id: "task-bfsg-media-alternatives",
    complianceControlId: CONTROL.bfsgMediaAlternatives,
    title: "Redaktionsprozess für Untertitel, Transkripte und Textalternativen aufsetzen",
    priority: "medium",
    state: "prepare_architecture",
    legalSourceIds: bfsgSources,
    needsLegalReview: false,
  });
  store.addTask({
    id: "task-bfsg-feedback-channel",
    complianceControlId: CONTROL.bfsgFeedbackChannel,
    title: "Feedback-Mechanismus und alternative Zugangswege konzipieren",
    priority: "medium",
    state: "prepare_architecture",
    legalSourceIds: bfsgSources,
    needsLegalReview: true,
  });

  store.addTask({
    id: "task-ai-disclosure-slot",
    complianceControlId: CONTROL.aiDisclosureSlot,
    title: "Disclosure-Slot und Platzierung (chat/contextual) vorbereiten",
    priority: "high",
    state: "update_legal_text",
    legalSourceIds: [SRC.aiActRegulation],
    needsLegalReview: true,
    outputArtifacts: ["src/ui/slots.tsx"],
  });
  store.addTask({
    id: "task-ai-pre-interaction-notice",
    complianceControlId: CONTROL.aiPreInteractionNotice,
    title: "Vorinteraktiven Hinweis im Chat-Einstieg vorbereiten",
    priority: "high",
    state: "prepare_architecture",
    legalSourceIds: [SRC.aiActRegulation],
    needsLegalReview: true,
  });
  store.addTask({
    id: "task-ai-content-marking",
    complianceControlId: CONTROL.aiContentMarking,
    title: "Wahrnehmbare und maschinenlesbare Kennzeichnung synthetischer Inhalte vorbereiten",
    priority: "high",
    state: "prepare_architecture",
    legalSourceIds: [SRC.aiActRegulation],
    needsLegalReview: true,
  });
  store.addTask({
    id: "task-ai-system-inventory",
    complianceControlId: CONTROL.aiSystemInventory,
    title: "KI-Funktionen inventarisieren und Rollen (Anbieter/Betreiber) klären",
    priority: "high",
    state: "review",
    legalSourceIds: [SRC.aiActRegulation],
    needsLegalReview: true,
  });
  store.addTask({
    id: "task-ai-interaction-log",
    complianceControlId: CONTROL.aiInteractionLog,
    title: "Logging-Struktur für KI-Interaktionen entwerfen",
    priority: "medium",
    state: "prepare_architecture",
    legalSourceIds: [SRC.aiActRegulation],
    needsLegalReview: false,
  });

  store.addTask({
    id: "task-data-transparency-slot",
    complianceControlId: CONTROL.dataTransparencySlot,
    title: "Transparenz-Slot für Datennutzungshinweise vorbereiten",
    priority: "medium",
    state: "update_legal_text",
    legalSourceIds: [SRC.dataActRegulation],
    needsLegalReview: true,
    outputArtifacts: ["src/ui/slots.tsx"],
  });
  store.addTask({
    id: "task-data-flow-documentation",
    complianceControlId: CONTROL.dataFlowDocumentation,
    title: "Datenkategorien, Speicherorte und Empfänger dokumentieren",
    priority: "medium",
    state: "implement",
    legalSourceIds: [SRC.dataActRegulation],
    needsLegalReview: true,
  });
  store.addTask({
    id: "task-data-access-export",
    complianceControlId: CONTROL.dataAccessExport,
    title: "Export- und Zugriffsschnittstelle entwerfen",
    priority: "medium",
    state: "prepare_architecture",
    legalSourceIds: [SRC.dataActRegulation],
    needsLegalReview: true,
  });
  store.addTask({
    id: "task-data-sharing-register",
    complianceControlId: CONTROL.dataSharingRegister,
    title: "Register der Datenweitergaben aufbauen",
    priority: "medium",
    state: "blocked",
    legalSourceIds: [SRC.dataActRegulation],
    needsLegalReview: true,
  });

  // --------------------------------------------------------- LegalTextSlots -
  // §4.5 / §12.4: alle Slots starten leer. Der Agent erzeugt keine Rechtstexte.
  store.addLegalTextSlot({
    id: SLOT.bfsgAccessibilityStatement,
    obligationId: OBLIGATION.bfsgStatement,
    slotKey: SLOT_KEYS.bfsgAccessibilityStatement,
    placement: "footer",
    textSource: "not_set",
    status: "empty",
  });
  store.addLegalTextSlot({
    id: SLOT.aiDisclosureNotice,
    obligationId: OBLIGATION.aiInteractionDisclosure,
    slotKey: SLOT_KEYS.aiActDisclosureNotice,
    placement: "chat",
    textSource: "not_set",
    status: "empty",
  });
  store.addLegalTextSlot({
    id: SLOT.aiSyntheticContentNotice,
    obligationId: OBLIGATION.aiSyntheticContent,
    slotKey: SLOT_KEYS.aiActSyntheticContentNotice,
    placement: "contextual",
    textSource: "not_set",
    status: "empty",
  });
  store.addLegalTextSlot({
    id: SLOT.dataTransparencyNotice,
    obligationId: OBLIGATION.dataTransparency,
    slotKey: SLOT_KEYS.dataActTransparencyNotice,
    placement: "settings",
    textSource: "not_set",
    status: "empty",
  });

  // ------------------------------------------------------ EvidenceArtifacts -
  store.addEvidence({
    id: "ev-bfsg-axe-baseline",
    obligationId: OBLIGATION.bfsgConformance,
    complianceControlId: CONTROL.bfsgA11yTestSetup,
    type: "accessibility_report",
    reference: "tests/accessibility.test.tsx (axe-core Baseline der Beispielkomponenten)",
    createdAt: SEED_DATE,
    createdBy: "agent",
    status: "collected",
  });
  store.addEvidence({
    id: "ev-ai-inventory-draft",
    obligationId: OBLIGATION.aiSystemInventory,
    complianceControlId: CONTROL.aiSystemInventory,
    type: "process_documentation",
    reference: "docs/ai-inventory.md (Entwurf)",
    createdAt: SEED_DATE,
    createdBy: "agent",
    status: "collected",
  });

  // ------------------------------------------- ApplicabilityAssessments -----
  // Demonstration der Aktualitätsregel (§6.6, F-13): Ein früheres BFSG-
  // Assessment des Demo-Shops wird durch die aktuelle Bewertung abgelöst und
  // bleibt über `supersededBy` im Audit-Trail erhalten.
  const bfsgAct = store.snapshot().legalActs.find((a) => a.id === ACT.bfsg);
  const demoProfile = projectProfiles.find((p) => p.id === PROFILE.demoShop);
  if (bfsgAct === undefined || demoProfile === undefined) {
    throw new Error("Seed inkonsistent: BFSG oder Demo-Profil fehlt.");
  }

  const outdatedBfsg = assessApplicability(bfsgAct, demoProfile, {
    clock: fixedClock("2026-08-01", "2026-08-01T09:00:00.000Z"),
    id: "asmt-bfsg-profile-demo-shop-2026-08-01",
  });
  store.addApplicabilityAssessment(outdatedBfsg, {
    reason: "Erstbewertung BFSG für den Demo-Shop.",
  });

  for (const profile of projectProfiles) {
    for (const act of store.snapshot().legalActs) {
      const assessment = assessApplicability(act, profile, { clock });
      if (act.id === ACT.bfsg && profile.id === PROFILE.demoShop) {
        store.supersedeAssessment(outdatedBfsg.id, assessment, {
          reason: "Neubewertung nach Gegenprüfung der Quellenlage (§6.6 Aktualitätsregel).",
        });
      } else {
        store.addApplicabilityAssessment(assessment, {
          reason: `Bewertung ${act.slug} gegen Profil ${profile.id} (§8).`,
        });
      }
    }
  }

  return store.snapshot();
}

/** Der Seed-Datensatz mit dem Standard-Seed-Clock. */
export const seedDataset: RegulatoryDataset = buildSeedDataset();
