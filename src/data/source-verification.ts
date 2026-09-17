/**
 * Protokoll der Gegenprüfung nach §16 Schritt 4 / DoD §17.2.
 *
 * Die Einträge sind Daten, nicht Rechtsauskunft. Sie halten fest, welche
 * Angabe aus §5 geprüft wurde, mit welchem Ergebnis, und was offen bleibt.
 */
import type { LegalActSlug } from "../domain/slugs.js";

export interface VerificationFinding {
  id: string;
  slug: LegalActSlug;
  specSection: string;
  claim: string;
  result: "confirmed" | "corrected" | "open";
  finding: string;
  openQuestion?: string;
}

export const SPEC_VERIFICATION_FINDINGS: VerificationFinding[] = [
  {
    id: "V-01",
    slug: "BFSG",
    specSection: "§5.1",
    claim: "In Kraft seit 28. Juni 2025; keine Übergangsfrist mehr für Neuprojekte.",
    result: "confirmed",
    finding:
      "Bestätigt. Verkündung BGBl. I 2021 S. 2970 (16.07.2021), Inkrafttreten 28.06.2025. § 38 BFSG " +
      "enthält Übergangsbestimmungen ausschließlich für vor dem 28.06.2025 rechtmäßig eingesetzte " +
      "Produkte und Bestandsverträge (längstens bis 27.06.2030) sowie Selbstbedienungsterminals " +
      "(bis zu 15 Jahre). Für Neuprojekte greift keine Übergangsfrist.",
  },
  {
    id: "V-02",
    slug: "BFSG",
    specSection: "§5.1",
    claim: "Online-Shops und digitale Dienstleistungen müssen WCAG 2.1 AA berücksichtigen.",
    result: "open",
    finding:
      "Nicht abschließend geprüft. Das BFSG selbst nennt keine WCAG-Stufe; die Konkretisierung läuft " +
      "über die BFSGV und harmonisierte Normen (EN 301 549). Die Gleichsetzung mit WCAG 2.1 AA ist " +
      "verbreitete Auslegung, aber keine unmittelbare Gesetzesangabe.",
    openQuestion:
      "Welche Konformitätsstufe ist für die konkrete Dienstleistung verbindlich, und aus welcher Norm " +
      "bzw. welchem Anhang der BFSGV ergibt sie sich?",
  },
  {
    id: "V-03",
    slug: "BFSG",
    specSection: "§5.1",
    claim: "Barrierefreiheitserklärung im Footer ist Pflicht.",
    result: "corrected",
    finding:
      "Teilweise bestätigt. § 14 Abs. 1 Nr. 2 BFSG i. V. m. Anlage 3 Nr. 1 verlangt, die Informationen " +
      "über die Barrierefreiheit der Dienstleistung zu erstellen und in barrierefreier Form öffentlich " +
      "zugänglich zu machen. Die Platzierung \"im Footer\" ist gängige Umsetzung, aber keine " +
      "gesetzliche Vorgabe — das Modell führt sie deshalb als `LegalTextSlot.placement`, nicht als Pflicht.",
  },
  {
    id: "V-04",
    slug: "EU_AI_ACT",
    specSection: "§5.2",
    claim: "Transparenzpflichten nach Art. 50 greifen seit August 2025.",
    result: "corrected",
    finding:
      "Nicht bestätigt. Nach Art. 113 VO (EU) 2024/1689 gilt Art. 50 ab dem 02.08.2026. Der 02.08.2025 " +
      "betrifft andere Bestimmungen (u. a. Pflichten für GPAI-Modelle und Governance), nicht Art. 50. " +
      "Der Seed trägt 2026-08-02 als applicableDate; der Rechtsakt steht auf reviewStatus " +
      "\"needs_legal_review\".",
    openQuestion:
      "Bestätigung der maßgeblichen Anwendungsdaten für das konkrete System durch die Rechtsabteilung, " +
      "einschließlich der Rolle (Anbieter oder Betreiber).",
  },
  {
    id: "V-05",
    slug: "EU_AI_ACT",
    specSection: "§5.2",
    claim: "Schrittweise Anwendbarkeit von 2025 bis 2027.",
    result: "open",
    finding:
      "Im Kern bestätigt (gestaffelte Anwendung nach Art. 113). In der Recherche traten Hinweise auf " +
      "spätere Änderungen der Hochrisiko-Stufen auf. Diese Hinweise stammen aus Sekundärquellen und " +
      "wurden nicht in den Seed übernommen, weil sie für ein Webprojekt ohne Hochrisiko-System nicht " +
      "einschlägig sind.",
    openQuestion:
      "Gilt der Zeitplan des Art. 113 unverändert, oder ist er zwischenzeitlich geändert worden? " +
      "Prüfung am konsolidierten Primärtext erforderlich.",
  },
  {
    id: "V-06",
    slug: "EU_DATA_ACT",
    specSection: "§5.3",
    claim: "Anwendbar seit September 2025.",
    result: "confirmed",
    finding:
      "Bestätigt. VO (EU) 2023/2854, Inkrafttreten 11.01.2024, Geltungsbeginn 12.09.2025 nach Art. 50. " +
      "Ergänzend im Seed erfasst: Art. 3 Abs. 1 greift für vernetzte Produkte, die ab dem 12.09.2026 " +
      "in Verkehr gebracht werden (als transitionEnd gesetzt).",
  },
  {
    id: "V-07",
    slug: "EU_DATA_ACT",
    specSection: "§5.3/§5.4",
    claim: "DSK ist als Quellsystem zu modellieren.",
    result: "open",
    finding:
      "Das Quellsystem \"DSK\" ist im Typ `SourceRecord.sourceSystem` vorgesehen, es wurde jedoch kein " +
      "DSK-Dokument erfasst. Eine Quelle zu erfinden wäre nach §3.3 und §12.2 unzulässig.",
    openQuestion:
      "Existiert eine einschlägige DSK-Orientierungshilfe für die Data-Act- oder AI-Act-Umsetzung, die " +
      "als SourceRecord zu erfassen ist?",
  },
];

/**
 * Übergreifende Einschränkung der Gegenprüfung. Sie gilt für alle Findings und
 * wird in jedem SourceRecord als `notes` wiederholt.
 */
export const VERIFICATION_LIMITATION =
  "Der direkte Abruf der Primärtexte (EUR-Lex, gesetze-im-internet.de) war in der Erstellungsumgebung " +
  "durch die Netzwerk-Policy blockiert. Die Gegenprüfung erfolgte über Sekundärrecherche auf die " +
  "jeweiligen amtlichen Fundstellen; alle SourceRecords tragen deshalb confidence \"medium\". Eine " +
  "Direktprüfung am Primärtext steht aus und ist im Open-Questions-Report gelistet.";
