# Compliance-Checklisten — Informationswebsite ohne Transaktion

Legende: `[ ]` offen · `[~]` vorbereitet/in Arbeit · `[?]` Review nötig · `[x]` erledigt · `[!]` blockiert. Der Status wird aus dem Datenmodell abgeleitet (Control-Status §7.4 bzw. LegalTextSlot-Status §6.9), nicht frei gesetzt.

## BFSG Checklist

| | Punkt | Kategorie | Status | Rechtstext | Nachweis | Legal Review |
|---|---|---|---|---|---|---|
| [~] | Accessibility-Struktur im Layout vorhanden | accessibility | `in_progress` | – | ja | ja |
| [~] | Footer-Slot für AccessibilityStatement vorhanden | architecture | `prepared` | ja | – | ja |
| [ ] | Feedback- oder Kontaktmechanismus vorbereitet | accessibility | `not_started` | – | ja | ja |
| [~] | Alternativzugänge berücksichtigt | accessibility | `in_progress` | – | ja | ja |
| [~] | Farbkontraste prüfbar | testing | `prepared` | – | ja | ja |
| [~] | Tastaturbedienung prüfbar | testing | `prepared` | – | ja | ja |
| [~] | Formular-Labels vorhanden | accessibility | `in_progress` | – | ja | ja |
| [~] | Fokus-States vorhanden | accessibility | `in_progress` | – | ja | ja |
| [~] | Semantische Überschriftenstruktur vorhanden | accessibility | `in_progress` | – | ja | ja |
| [ ] | Media-Alternativen vorbereitet | content | `not_started` | – | ja | ja |
| [~] | Accessibility-Test-Setup vorhanden | testing | `prepared` | – | ja | ja |
| [ ] | Rechtstext-Slot nicht eigenmächtig befüllt | content | `not_started` | ja | – | ja |

Erläuterungen:

- **Accessibility-Struktur im Layout vorhanden:** Landmarks, semantische Struktur und Skip-Links sind im Layout angelegt.
- **Alternativzugänge berücksichtigt:** Alternative Zugangswege zu Kernfunktionen sind konzipiert und dokumentiert.
- **Media-Alternativen vorbereitet:** Untertitel, Transkripte und Textalternativen sind als Struktur vorgesehen.
- **Rechtstext-Slot nicht eigenmächtig befüllt:** Der Slot ist leer oder trägt einen freigegebenen Text aus Generator, Kanzlei, offizieller Quelle oder interner Freigabe (§12.1–§12.3).

## AI Act Checklist

_Keine Punkte erzeugt: Nicht anwendbar für dieses Profil (§8.3 Regel 6): Profil weist keine KI-Funktion aus (hasAiChatbot, hasAiGeneratedContent, hasAutomatedDecisions sind alle false) — es darf keine AI-Act-Pflicht als anwendbar markiert werden (§8.3 Regel 1)._

## Data Act Checklist

| | Punkt | Kategorie | Status | Rechtstext | Nachweis | Legal Review |
|---|---|---|---|---|---|---|
| [~] | Relevante Datenkategorien identifiziert | data_transparency | `in_progress` | – | ja | ja |
| [~] | IoT-Bezug geprüft | data_transparency | `in_progress` | – | ja | ja |
| [~] | Nutzerdaten-Bezug geprüft | data_transparency | `in_progress` | – | ja | ja |
| [ ] | Datenzugriffspflichten geprüft | data_transparency | `not_started` | – | ja | ja |
| [~] | Transparenzhinweise vorbereitet | data_transparency | `prepared` | ja | – | ja |
| [ ] | Datenportabilität geprüft | architecture | `not_started` | – | ja | ja |
| [!] | Third-Party-Sharing geprüft | data_transparency | `blocked` | – | ja | ja |
| [~] | Dokumentation der Datenflüsse vorbereitet | documentation | `in_progress` | – | ja | ja |
| [ ] | Rechtstext-Slot nicht eigenmächtig befüllt | content | `not_started` | ja | – | ja |
| [x] | Needs-Legal-Review-Flag bei Unsicherheit gesetzt | legal_review | `done` | – | – | ja |

Erläuterungen:

- **Needs-Legal-Review-Flag bei Unsicherheit gesetzt:** Bei confidence:"low" muss das gültige ApplicabilityAssessment needsLegalReview:true tragen (§8.3 Regel 4/5).
