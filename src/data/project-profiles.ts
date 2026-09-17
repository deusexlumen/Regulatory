/**
 * SPEC v2 §16 Schritt 1 — ProjectProfile und Annahmen.
 *
 * Zwei Profile, damit die Anwendbarkeitslogik (§8.3) in beiden Richtungen
 * sichtbar wird: ein Profil mit klarer Betroffenheit und ein Profil, das die
 * "Prüfgegenstand"-Regeln auslöst.
 */
import type { ProjectProfile } from "../domain/types.js";
import { PROFILE } from "./ids.js";

/** Annahme: transaktionaler Online-Shop mit KI-Assistent und Analytics. */
export const demoShopProfile: ProjectProfile = {
  id: PROFILE.demoShop,
  name: "Demo Online-Shop (transaktional, KI-Assistent)",
  jurisdiction: "DE+EU",
  isECommerce: true,
  hasUserAccounts: true,
  hasAiChatbot: true,
  hasAiGeneratedContent: true,
  hasAutomatedDecisions: false,
  hasIotConnection: false,
  hasUserGeneratedData: true,
  hasThirdPartyDataSharing: true,
  hasAnalytics: true,
  hasNewsletter: true,
  hasPayment: true,
  hasMarketplaceFeatures: false,
  hasAccessibilityRelevantService: true,
  accessibilityRelevance: "high",
};

/**
 * Annahme: rein informative Unternehmenswebsite ohne Transaktion, ohne KI,
 * ohne vernetztes Produkt. Löst §8.3 Regel 1 (AI Act nicht anwendbar) sowie
 * Regel 2 und 3 (BFSG/Data Act als Prüfgegenstand) aus.
 */
export const brochureSiteProfile: ProjectProfile = {
  id: PROFILE.brochureSite,
  name: "Informationswebsite ohne Transaktion",
  jurisdiction: "DE",
  isECommerce: false,
  hasUserAccounts: false,
  hasAiChatbot: false,
  hasAiGeneratedContent: false,
  hasAutomatedDecisions: false,
  hasIotConnection: false,
  hasUserGeneratedData: false,
  hasThirdPartyDataSharing: false,
  hasAnalytics: false,
  hasNewsletter: false,
  hasPayment: false,
  hasMarketplaceFeatures: false,
  hasAccessibilityRelevantService: false,
  accessibilityRelevance: "unknown",
};

export const projectProfiles: ProjectProfile[] = [demoShopProfile, brochureSiteProfile];

/** Standardprofil für die Report-Erzeugung (§15). */
export const DEFAULT_PROFILE_ID = PROFILE.demoShop;
