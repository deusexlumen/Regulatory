# Open Questions Report — Informationswebsite ohne Transaktion

Stand: 2026-09-16 (Zeitzone Europe/Berlin)

> Dieser Report listet bewusst jede offene Unsicherheit. Nichts davon darf durch Vereinfachung verschwinden (§3 Nicht-Ziel 9).

## Gegenprüfung der Arbeitsstand-Daten aus §5

_Der direkte Abruf der Primärtexte (EUR-Lex, gesetze-im-internet.de) war in der Erstellungsumgebung durch die Netzwerk-Policy blockiert. Die Gegenprüfung erfolgte über Sekundärrecherche auf die jeweiligen amtlichen Fundstellen; alle SourceRecords tragen deshalb confidence "medium". Eine Direktprüfung am Primärtext steht aus und ist im Open-Questions-Report gelistet._

| ID | Abschnitt | Rechtsakt | Angabe | Ergebnis | Befund |
|---|---|---|---|---|---|
| V-01 | §5.1 | `BFSG` | In Kraft seit 28. Juni 2025; keine Übergangsfrist mehr für Neuprojekte. | **confirmed** | Bestätigt. Verkündung BGBl. I 2021 S. 2970 (16.07.2021), Inkrafttreten 28.06.2025. § 38 BFSG enthält Übergangsbestimmungen ausschließlich für vor dem 28.06.2025 rechtmäßig eingesetzte Produkte und Bestandsverträge (längstens bis 27.06.2030) sowie Selbstbedienungsterminals (bis zu 15 Jahre). Für Neuprojekte greift keine Übergangsfrist. |
| V-02 | §5.1 | `BFSG` | Online-Shops und digitale Dienstleistungen müssen WCAG 2.1 AA berücksichtigen. | **open** | Nicht abschließend geprüft. Das BFSG selbst nennt keine WCAG-Stufe; die Konkretisierung läuft über die BFSGV und harmonisierte Normen (EN 301 549). Die Gleichsetzung mit WCAG 2.1 AA ist verbreitete Auslegung, aber keine unmittelbare Gesetzesangabe. |
| V-03 | §5.1 | `BFSG` | Barrierefreiheitserklärung im Footer ist Pflicht. | **corrected** | Teilweise bestätigt. § 14 Abs. 1 Nr. 2 BFSG i. V. m. Anlage 3 Nr. 1 verlangt, die Informationen über die Barrierefreiheit der Dienstleistung zu erstellen und in barrierefreier Form öffentlich zugänglich zu machen. Die Platzierung "im Footer" ist gängige Umsetzung, aber keine gesetzliche Vorgabe — das Modell führt sie deshalb als `LegalTextSlot.placement`, nicht als Pflicht. |
| V-04 | §5.2 | `EU_AI_ACT` | Transparenzpflichten nach Art. 50 greifen seit August 2025. | **corrected** | Nicht bestätigt. Nach Art. 113 VO (EU) 2024/1689 gilt Art. 50 ab dem 02.08.2026. Der 02.08.2025 betrifft andere Bestimmungen (u. a. Pflichten für GPAI-Modelle und Governance), nicht Art. 50. Der Seed trägt 2026-08-02 als applicableDate; der Rechtsakt steht auf reviewStatus "needs_legal_review". |
| V-05 | §5.2 | `EU_AI_ACT` | Schrittweise Anwendbarkeit von 2025 bis 2027. | **open** | Im Kern bestätigt (gestaffelte Anwendung nach Art. 113). In der Recherche traten Hinweise auf spätere Änderungen der Hochrisiko-Stufen auf. Diese Hinweise stammen aus Sekundärquellen und wurden nicht in den Seed übernommen, weil sie für ein Webprojekt ohne Hochrisiko-System nicht einschlägig sind. |
| V-06 | §5.3 | `EU_DATA_ACT` | Anwendbar seit September 2025. | **confirmed** | Bestätigt. VO (EU) 2023/2854, Inkrafttreten 11.01.2024, Geltungsbeginn 12.09.2025 nach Art. 50. Ergänzend im Seed erfasst: Art. 3 Abs. 1 greift für vernetzte Produkte, die ab dem 12.09.2026 in Verkehr gebracht werden (als transitionEnd gesetzt). |
| V-07 | §5.3/§5.4 | `EU_DATA_ACT` | DSK ist als Quellsystem zu modellieren. | **open** | Das Quellsystem "DSK" ist im Typ `SourceRecord.sourceSystem` vorgesehen, es wurde jedoch kein DSK-Dokument erfasst. Eine Quelle zu erfinden wäre nach §3.3 und §12.2 unzulässig. |

## Fehlende Quellen (7)

- `source_record:src-bfsg-eu-dir-2019-882` — Richtlinie (EU) 2019/882 hat confidence "medium". Direktprüfung am Primärtext ausstehend.
- `source_record:src-bfsg-bgbl-2021-2970` — BGBl. I 2021 S. 2970 hat confidence "medium". Direktprüfung am Primärtext ausstehend.
- `source_record:src-eu-ai-act-reg-2024-1689` — Verordnung (EU) 2024/1689 hat confidence "medium". Direktprüfung am Primärtext ausstehend.
- `source_record:src-eu-data-act-reg-2023-2854` — Verordnung (EU) 2023/2854 hat confidence "medium". Direktprüfung am Primärtext ausstehend.
- `spec_verification:V-02` — §5.1 (BFSG): Welche Konformitätsstufe ist für die konkrete Dienstleistung verbindlich, und aus welcher Norm bzw. welchem Anhang der BFSGV ergibt sie sich?
- `spec_verification:V-05` — §5.2 (EU_AI_ACT): Gilt der Zeitplan des Art. 113 unverändert, oder ist er zwischenzeitlich geändert worden? Prüfung am konsolidierten Primärtext erforderlich.
- `spec_verification:V-07` — §5.3/§5.4 (EU_DATA_ACT): Existiert eine einschlägige DSK-Orientierungshilfe für die Data-Act- oder AI-Act-Umsetzung, die als SourceRecord zu erfassen ist?

## Unklare Fristen (0)

_Keine offenen Punkte._

## Unklare Anwendbarkeit (2)

- `applicability_assessment:asmt-bfsg-profile-brochure-site-2026-09-16` — BFSG: Anwendbarkeit mit confidence "low" bewertet. Prüfgegenstand (§8.3): Profil weist weder E-Commerce- noch digitale Dienstleistungsrelevanz aus; BFSG-Anwendbarkeit ist damit nicht automatisch gegeben, aber auch nicht ausgeschlossen (Regel 2). Vorläufige Arbeitsannahme applicable:true bei confidence:low — rechtliche Prüfung erforderlich.
- `applicability_assessment:asmt-eu_data_act-profile-brochure-site-2026-09-16` — EU_DATA_ACT: Anwendbarkeit mit confidence "low" bewertet. Prüfgegenstand (§8.3): Profil weist weder IoT-, Nutzerdaten- noch Datenzugriffsrelevanz aus; Data-Act-Anwendbarkeit ist damit nicht automatisch gegeben, aber auch nicht ausgeschlossen (Regel 3). Vorläufige Arbeitsannahme applicable:true bei confidence:low — rechtliche Prüfung erforderlich.

## Rechtlicher Prüfbedarf (10)

- `spec_verification:V-04` — §5.2 (EU_AI_ACT): Bestätigung der maßgeblichen Anwendungsdaten für das konkrete System durch die Rechtsabteilung, einschließlich der Rolle (Anbieter oder Betreiber).
- `applicability_assessment:asmt-bfsg-profile-brochure-site-2026-09-16` — BFSG: needsLegalReview gesetzt, aber noch kein reviewedBy/reviewedAt erfasst. (§6.6, F-16)
- `legal_act:act-eu-ai-act` — EU_AI_ACT steht auf reviewStatus "needs_legal_review". Transparenzpflichten für KI-Interaktion und synthetische Inhalte. ACHTUNG: Die Arbeitsstand-Angabe aus SPEC §5.2 (Art. 50 seit August 2025) wurde durch die Gegenprüfung nicht bestätigt.
- `applicability_assessment:asmt-eu_data_act-profile-brochure-site-2026-09-16` — EU_DATA_ACT: needsLegalReview gesetzt, aber noch kein reviewedBy/reviewedAt erfasst. (§6.6, F-16)
- `obligation:obl-bfsg-wcag-conformance` — BFSG — "Barrierefreiheitsanforderungen an die Dienstleistung technisch erfüllen": Wahrnehmbarkeit, Bedienbarkeit, Verständlichkeit und Robustheit der digitalen Dienstleistung. Die Konkretisierung erfolgt über die BFSGV und die harmonisierten Normen; die genaue Konformitätsstufe (Arbeitsstand §5.1: WCAG 2.1 AA) ist rechtlich zu bestätigen.
- `obligation:obl-bfsg-feedback-channel` — BFSG — "Feedback- und Kontaktmechanismus zur Barrierefreiheit bereitstellen": Rückmeldemöglichkeit zu Barrieren und alternative Zugangswege. Die genaue Ausgestaltung und die Verortung der Pflicht sind zu bestätigen.
- `obligation:obl-ai-act-system-inventory` — EU_AI_ACT — "KI-Systeminventar und Nachvollziehbarkeit vorbereiten": Vorbereitungsmaßnahme ohne eigenständige Norm: ohne Inventar der eingesetzten KI-Funktionen ist weder die Rollenzuordnung (Anbieter/Betreiber) noch der Pflichtenumfang bestimmbar.
- `obligation:obl-data-act-transparency-information` — EU_DATA_ACT — "Transparenz über Datenerhebung, Datenspeicherung und Datenzugriff": Informationen darüber, welche Daten erzeugt, gespeichert und zugänglich gemacht werden. Für Projekte ohne vernetztes Produkt ist die Reichweite auslegungsbedürftig.
- `obligation:obl-data-act-access-portability` — EU_DATA_ACT — "Datenzugang und Datenportabilität ermöglichen": Zugriff auf und Übertragbarkeit von Nutzungsdaten in einem strukturierten, gängigen und maschinenlesbaren Format.
- `obligation:obl-data-act-third-party-sharing` — EU_DATA_ACT — "Weitergabe an Dritte dokumentieren und steuern": Register der Datenempfänger, Zwecke und Rechtsgrundlagen der Weitergabe.

## Fehlende Freigaben (6)

- `legal_text_slot:slot-bfsg-accessibility-statement` — Slot `bfsg.accessibility_statement` ist nicht freigegeben (status "empty", textSource "not_set"). Rechtstext muss aus Generator, Kanzlei, offizieller Quelle oder interner Freigabe stammen (§12.1).
- `legal_text_slot:slot-eu-ai-act-disclosure-notice` — Slot `eu_ai_act.disclosure_notice` ist nicht freigegeben (status "empty", textSource "not_set"). Rechtstext muss aus Generator, Kanzlei, offizieller Quelle oder interner Freigabe stammen (§12.1).
- `legal_text_slot:slot-eu-ai-act-synthetic-content-notice` — Slot `eu_ai_act.synthetic_content_notice` ist nicht freigegeben (status "empty", textSource "not_set"). Rechtstext muss aus Generator, Kanzlei, offizieller Quelle oder interner Freigabe stammen (§12.1).
- `legal_text_slot:slot-eu-data-act-transparency-notice` — Slot `eu_data_act.transparency_notice` ist nicht freigegeben (status "empty", textSource "not_set"). Rechtstext muss aus Generator, Kanzlei, offizieller Quelle oder interner Freigabe stammen (§12.1).
- `evidence:ev-bfsg-axe-baseline` — Nachweis "accessibility_report" hat Status "collected" — Freigabe ausstehend. (§4.7)
- `evidence:ev-ai-inventory-draft` — Nachweis "process_documentation" hat Status "collected" — Freigabe ausstehend. (§4.7)

## Technische Blocker (2)

- `control:ctl-data-act-sharing-register` — Kontrolle "Register der Third-Party-Datenweitergaben" ist blockiert. Blockiert: Empfängerliste und Zweckbindung sind ohne abgeschlossene Datenflussdokumentation nicht bestimmbar.
- `task:task-data-sharing-register` — Task "Register der Datenweitergaben aufbauen" ist blockiert. (§6.8, F-07)

**Gesamt: 27 offene Punkte.**
