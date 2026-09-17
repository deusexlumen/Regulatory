/**
 * SPEC v2 §6.1 — LegalActSlug
 *
 * Kanonische, stabile Kennung für die bekannten Rechtsakte. Wird überall dort
 * referenziert, wo in v1 freie Strings verwendet wurden (löst F-02).
 *
 * Weitere Rechtsakte erhalten ebenfalls einen stabilen Slug in diesem Enum —
 * freie Strings für `LegalAct.slug` sind nicht zulässig.
 */
export type LegalActSlug = "BFSG" | "EU_AI_ACT" | "EU_DATA_ACT";

export const LEGAL_ACT_SLUGS = ["BFSG", "EU_AI_ACT", "EU_DATA_ACT"] as const;

export function isLegalActSlug(value: unknown): value is LegalActSlug {
  return typeof value === "string" && (LEGAL_ACT_SLUGS as readonly string[]).includes(value);
}

/**
 * SPEC v2 §11.1 — Slot-Key-Konvention `"<slug_lowercase>.<zweck>"`.
 */
export function slotKeyFor(slug: LegalActSlug, purpose: string): string {
  return `${slug.toLowerCase()}.${purpose}`;
}

export const SLOT_KEYS = {
  bfsgAccessibilityStatement: "bfsg.accessibility_statement",
  aiActDisclosureNotice: "eu_ai_act.disclosure_notice",
  aiActSyntheticContentNotice: "eu_ai_act.synthetic_content_notice",
  dataActTransparencyNotice: "eu_data_act.transparency_notice",
} as const;

export type KnownSlotKey = (typeof SLOT_KEYS)[keyof typeof SLOT_KEYS];
