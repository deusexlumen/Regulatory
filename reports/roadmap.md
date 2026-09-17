# Regulatory Roadmap — Demo Online-Shop (transaktional, KI-Assistent)

Stand: 2026-09-16 (Fristenbezug: Zeitzone Europe/Berlin, §9.5.2)

> **Kein Rechtsrat.** Dieser Report ist ein technisches Steuerungsdokument. Er ersetzt weder eine rechtliche Prüfung noch eine Freigabe. Alle regulatorischen Angaben sind Arbeitsstand und an die verlinkten Quellen gebunden (§1, §3).

## 1. Regulierungen und Anwendbarkeit

| Rechtsakt | Lifecycle | Anwendbarkeit | Konfidenz | Frist | Roadmap-Items | Höchste Priorität |
|---|---|---|---|---|---|---|
| BFSG (`BFSG`) | `applicable` | anwendbar | high | 2025-06-28 (seit 445 Tagen überfällig) | 4 | CRITICAL |
| AI Act (`EU_AI_ACT`) | `applicable` | anwendbar | high | 2026-08-02 (seit 45 Tagen überfällig) | 4 | CRITICAL |
| Data Act (`EU_DATA_ACT`) | `applicable` | rechtliche Prüfung erforderlich | medium | 2026-09-12 (seit 4 Tagen überfällig) | 4 | CRITICAL |

## 2. Priorisierte Maßnahmen

### [CRITICAL] Informationen zur Barrierefreiheit öffentlich zugänglich bereitstellen

- **Rechtsakt:** BFSG (`BFSG`), Lifecycle `applicable`
- **Norm:** § 14 Abs. 1 Nr. 2 BFSG i. V. m. Anlage 3 Nr. 1 BFSG
- **Kontrolle:** Footer-Slot AccessibilityStatement (View auf LegalTextSlot) (`ctl-bfsg-statement-slot`, Status `prepared`)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2025-06-28 (seit 445 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2025-06-28 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Rechtstext nicht freigegeben, Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot bfsg.accessibility_statement bleibt bis zur Freigabe Platzhalter (§12.1–§12.4).
- **Architekturvorbereitung:** nicht erforderlich
- **Rechtstextbedarf:** ja — Slot ist nicht freigegeben
- **Review-Bedarf:** nein
- **Abhängigkeiten:** `control:ctl-bfsg-statement-slot`, `legal_text_slot:slot-bfsg-accessibility-statement`
- **Blocker:**
  - Rechtstext-Slot nicht freigabekonform: bfsg.accessibility_statement (§12.3).
  - Nachweis für Pflicht obl-bfsg-accessibility-statement liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Feedback- und Kontaktmechanismus zur Barrierefreiheit bereitstellen

- **Rechtsakt:** BFSG (`BFSG`), Lifecycle `applicable`
- **Norm:** Richtlinie (EU) 2019/882, Anhang I Abschnitt III (Umsetzung über BFSG/BFSGV)
- **Kontrolle:** Feedback- und Kontaktmechanismus zur Barrierefreiheit (`ctl-bfsg-feedback-channel`, Status `not_started`)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2025-06-28 (seit 445 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2025-06-28 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-bfsg-feedback-channel`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-bfsg-feedback-channel liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Barrierefreiheitsanforderungen an die Dienstleistung technisch erfüllen

- **Rechtsakt:** BFSG (`BFSG`), Lifecycle `applicable`
- **Norm:** § 3 BFSG i. V. m. BFSGV
- **Kontrolle:** zusammengefasst über mehrere Kontrollen, ungünstigster Status `prepared` (§9.6)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2025-06-28 (seit 445 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2025-06-28 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** nicht erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-bfsg-a11y-structure`, `control:ctl-bfsg-a11y-test-setup`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-bfsg-wcag-conformance liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Barrierefreiheitsanforderungen an die Dienstleistung technisch erfüllen

- **Rechtsakt:** BFSG (`BFSG`), Lifecycle `applicable`
- **Norm:** § 3 BFSG i. V. m. BFSGV
- **Kontrolle:** Media-Alternativen (Untertitel, Transkripte, Textalternativen) (`ctl-bfsg-media-alternatives`, Status `not_started`)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2025-06-28 (seit 445 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2025-06-28 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-bfsg-media-alternatives`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-bfsg-wcag-conformance liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Offenlegung der KI-Interaktion gegenüber natürlichen Personen

- **Rechtsakt:** AI Act (`EU_AI_ACT`), Lifecycle `applicable`
- **Norm:** Art. 50 Abs. 1 VO (EU) 2024/1689
- **Kontrolle:** zusammengefasst über mehrere Kontrollen, ungünstigster Status `not_started` (§9.6)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2026-08-02 (seit 45 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-08-02 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Rechtstext nicht freigegeben, Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot eu_ai_act.disclosure_notice bleibt bis zur Freigabe Platzhalter (§12.1–§12.4).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** ja — Slot ist nicht freigegeben
- **Review-Bedarf:** nein
- **Abhängigkeiten:** `control:ctl-ai-act-disclosure-slot`, `legal_text_slot:slot-eu-ai-act-disclosure-notice`, `control:ctl-ai-act-pre-interaction-notice`
- **Blocker:**
  - Rechtstext-Slot nicht freigabekonform: eu_ai_act.disclosure_notice (§12.3).
  - Nachweis für Pflicht obl-ai-act-interaction-disclosure liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Kennzeichnung synthetisch erzeugter Inhalte

- **Rechtsakt:** AI Act (`EU_AI_ACT`), Lifecycle `applicable`
- **Norm:** Art. 50 Abs. 2 und Abs. 4 VO (EU) 2024/1689
- **Kontrolle:** Kennzeichnung synthetischer Inhalte (wahrnehmbar und maschinenlesbar) (`ctl-ai-act-content-marking`, Status `not_started`)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2026-08-02 (seit 45 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-08-02 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Rechtstext nicht freigegeben, Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot eu_ai_act.synthetic_content_notice bleibt bis zur Freigabe Platzhalter (§12.1–§12.4).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** ja — Slot ist nicht freigegeben
- **Review-Bedarf:** nein
- **Abhängigkeiten:** `control:ctl-ai-act-content-marking`, `legal_text_slot:slot-eu-ai-act-synthetic-content-notice`
- **Blocker:**
  - Rechtstext-Slot nicht freigabekonform: eu_ai_act.synthetic_content_notice (§12.3).
  - Nachweis für Pflicht obl-ai-act-synthetic-content liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] KI-Systeminventar und Nachvollziehbarkeit vorbereiten

- **Rechtsakt:** AI Act (`EU_AI_ACT`), Lifecycle `applicable`
- **Norm:** Vorbereitungsmaßnahme zu Art. 50 VO (EU) 2024/1689 — keine eigenständige Norm
- **Kontrolle:** Logging der KI-Interaktionen als Nachweisstruktur (`ctl-ai-act-interaction-log`, Status `not_started`)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2026-08-02 (seit 45 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-08-02 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-ai-act-interaction-log`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-ai-act-system-inventory liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] KI-Systeminventar und Nachvollziehbarkeit vorbereiten

- **Rechtsakt:** AI Act (`EU_AI_ACT`), Lifecycle `applicable`
- **Norm:** Vorbereitungsmaßnahme zu Art. 50 VO (EU) 2024/1689 — keine eigenständige Norm
- **Kontrolle:** Inventar der eingesetzten KI-Funktionen (`ctl-ai-act-system-inventory`, Status `in_progress`)
- **Anwendbarkeit:** anwendbar
- **Frist:** 2026-08-02 (seit 45 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-08-02 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** nicht erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-ai-act-system-inventory`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-ai-act-system-inventory liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Datenzugang und Datenportabilität ermöglichen

- **Rechtsakt:** Data Act (`EU_DATA_ACT`), Lifecycle `applicable`
- **Norm:** Art. 4 und Art. 5 VO (EU) 2023/2854
- **Kontrolle:** Datenzugriff und Export in maschinenlesbarem Format (`ctl-data-act-access-export`, Status `not_started`)
- **Anwendbarkeit:** rechtliche Prüfung erforderlich
- **Frist:** 2026-09-12 (seit 4 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-09-12 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-data-act-access-export`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-data-act-access-portability liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Weitergabe an Dritte dokumentieren und steuern

- **Rechtsakt:** Data Act (`EU_DATA_ACT`), Lifecycle `applicable`
- **Norm:** Art. 5 und Art. 6 VO (EU) 2023/2854
- **Kontrolle:** Register der Third-Party-Datenweitergaben (`ctl-data-act-sharing-register`, Status `blocked`)
- **Anwendbarkeit:** rechtliche Prüfung erforderlich
- **Frist:** 2026-09-12 (seit 4 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-09-12 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** erforderlich
- **Rechtstextbedarf:** nein
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-data-act-sharing-register`
- **Blocker:**
  - Kontrolle ctl-data-act-sharing-register ("Register der Third-Party-Datenweitergaben") ist blockiert (§7.4).
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Nachweis für Pflicht obl-data-act-third-party-sharing liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Transparenz über Datenerhebung, Datenspeicherung und Datenzugriff

- **Rechtsakt:** Data Act (`EU_DATA_ACT`), Lifecycle `applicable`
- **Norm:** Art. 3 Abs. 2 VO (EU) 2023/2854
- **Kontrolle:** Datenflussdokumentation (Kategorien, Speicherorte, Empfänger) (`ctl-data-act-dataflow-documentation`, Status `in_progress`)
- **Anwendbarkeit:** rechtliche Prüfung erforderlich
- **Frist:** 2026-09-12 (seit 4 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-09-12 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Rechtstext nicht freigegeben, Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** nicht erforderlich
- **Rechtstextbedarf:** ja — Slot ist nicht freigegeben
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-data-act-dataflow-documentation`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Rechtstext-Slot nicht freigabekonform: eu_data_act.transparency_notice (§12.3).
  - Nachweis für Pflicht obl-data-act-transparency-information liegt nicht freigegeben vor (§4.7, §7.2.5).

### [CRITICAL] Transparenz über Datenerhebung, Datenspeicherung und Datenzugriff

- **Rechtsakt:** Data Act (`EU_DATA_ACT`), Lifecycle `applicable`
- **Norm:** Art. 3 Abs. 2 VO (EU) 2023/2854
- **Kontrolle:** Transparenz-Slot Datennutzung (View auf LegalTextSlot) (`ctl-data-act-transparency-slot`, Status `prepared`)
- **Anwendbarkeit:** rechtliche Prüfung erforderlich
- **Frist:** 2026-09-12 (seit 4 Tagen überfällig)
- **Priorität:** CRITICAL — Frist 2026-09-12 liegt weniger als 90 Tage in der Zukunft, die Umsetzung ist nicht abgeschlossen und eine tatsächlich verlangte Bedingung ist offen (Rechtstext nicht freigegeben, Nachweis nicht freigegeben). (Regel §9.3.1)
- **Empfohlene Aktion:** Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **Architekturvorbereitung:** nicht erforderlich
- **Rechtstextbedarf:** ja — Slot ist nicht freigegeben
- **Review-Bedarf:** ja
- **Abhängigkeiten:** `control:ctl-data-act-transparency-slot`, `legal_text_slot:slot-eu-data-act-transparency-notice`
- **Blocker:**
  - Rechtliche Prüfung offen — keine finale Pflichtaussage zulässig (§9.4.3).
  - Rechtstext-Slot nicht freigabekonform: eu_data_act.transparency_notice (§12.3).
  - Nachweis für Pflicht obl-data-act-transparency-information liegt nicht freigegeben vor (§4.7, §7.2.5).

## 3. Nächste Schritte

- **CRITICAL** Informationen zur Barrierefreiheit öffentlich zugänglich bereitstellen: Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot bfsg.accessibility_statement bleibt bis zur Freigabe Platzhalter (§12.1–§12.4).
- **CRITICAL** Feedback- und Kontaktmechanismus zur Barrierefreiheit bereitstellen: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **CRITICAL** Barrierefreiheitsanforderungen an die Dienstleistung technisch erfüllen: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **CRITICAL** Barrierefreiheitsanforderungen an die Dienstleistung technisch erfüllen: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **CRITICAL** Offenlegung der KI-Interaktion gegenüber natürlichen Personen: Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot eu_ai_act.disclosure_notice bleibt bis zur Freigabe Platzhalter (§12.1–§12.4).
- **CRITICAL** Kennzeichnung synthetisch erzeugter Inhalte: Rechtstext über Generator, Kanzlei oder offizielle Quelle beschaffen und freigeben; Slot eu_ai_act.synthetic_content_notice bleibt bis zur Freigabe Platzhalter (§12.1–§12.4).
- **CRITICAL** KI-Systeminventar und Nachvollziehbarkeit vorbereiten: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **CRITICAL** KI-Systeminventar und Nachvollziehbarkeit vorbereiten: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **CRITICAL** Datenzugang und Datenportabilität ermöglichen: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).
- **CRITICAL** Weitergabe an Dritte dokumentieren und steuern: Rechtliche Prüfung einholen und Ergebnis als ApplicabilityAssessment nachführen. Bis zur Freigabe darf keine finale Pflicht behauptet und kein finaler Rechtstext eingebunden werden (§9.4.3).

Offene rechtliche Punkte, fehlende Quellen und fehlende Freigaben sind im Open-Questions-Report (`open-questions.md`, §15.4) gelistet.
