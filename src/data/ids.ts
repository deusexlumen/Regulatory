/**
 * Stabile Ids der Seed-Daten.
 *
 * Sie sind an zwei Stellen nötig — im Seed selbst und in den Checklisten-
 * Vorlagen (§10.3–§10.5), die ihren Zustand aus Kontrollen und Slots ableiten.
 * Deshalb liegen sie hier zentral statt als Literale verstreut.
 */
export const ACT = {
  bfsg: "act-bfsg",
  aiAct: "act-eu-ai-act",
  dataAct: "act-eu-data-act",
} as const;

export const OBLIGATION = {
  bfsgStatement: "obl-bfsg-accessibility-statement",
  bfsgConformance: "obl-bfsg-wcag-conformance",
  bfsgFeedback: "obl-bfsg-feedback-channel",
  aiInteractionDisclosure: "obl-ai-act-interaction-disclosure",
  aiSyntheticContent: "obl-ai-act-synthetic-content",
  aiSystemInventory: "obl-ai-act-system-inventory",
  dataTransparency: "obl-data-act-transparency-information",
  dataAccessPortability: "obl-data-act-access-portability",
  dataThirdPartySharing: "obl-data-act-third-party-sharing",
} as const;

export const CONTROL = {
  bfsgStatementSlot: "ctl-bfsg-statement-slot",
  bfsgA11yStructure: "ctl-bfsg-a11y-structure",
  bfsgA11yTestSetup: "ctl-bfsg-a11y-test-setup",
  bfsgMediaAlternatives: "ctl-bfsg-media-alternatives",
  bfsgFeedbackChannel: "ctl-bfsg-feedback-channel",
  aiDisclosureSlot: "ctl-ai-act-disclosure-slot",
  aiPreInteractionNotice: "ctl-ai-act-pre-interaction-notice",
  aiContentMarking: "ctl-ai-act-content-marking",
  aiSystemInventory: "ctl-ai-act-system-inventory",
  aiInteractionLog: "ctl-ai-act-interaction-log",
  dataTransparencySlot: "ctl-data-act-transparency-slot",
  dataFlowDocumentation: "ctl-data-act-dataflow-documentation",
  dataAccessExport: "ctl-data-act-access-export",
  dataSharingRegister: "ctl-data-act-sharing-register",
} as const;

export const SLOT = {
  bfsgAccessibilityStatement: "slot-bfsg-accessibility-statement",
  aiDisclosureNotice: "slot-eu-ai-act-disclosure-notice",
  aiSyntheticContentNotice: "slot-eu-ai-act-synthetic-content-notice",
  dataTransparencyNotice: "slot-eu-data-act-transparency-notice",
} as const;

export const PROFILE = {
  demoShop: "profile-demo-shop",
  brochureSite: "profile-brochure-site",
} as const;
