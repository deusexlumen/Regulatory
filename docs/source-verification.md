# Gegenprüfung der Arbeitsstand-Daten (§16 Schritt 4, DoD §17.2)

§5 der Spezifikation kennzeichnet die regulatorischen Eingangswerte
ausdrücklich als **Arbeitsstand** und verlangt in §16 Schritt 4 eine
Gegenprüfung gegen Primärquellen, bevor daraus Seed-Daten werden.

## Einschränkung dieser Prüfung

Der **direkte Abruf der Primärtexte** (EUR-Lex, gesetze-im-internet.de) war in
der Erstellungsumgebung durch die Netzwerk-Policy blockiert. Die Gegenprüfung
erfolgte über Recherche auf die jeweiligen amtlichen Fundstellen, nicht durch
Lesen des konsolidierten Primärtexts.

Konsequenzen im Datenmodell:

- Alle `SourceRecord`-Einträge tragen `confidence: "medium"`, nicht `"high"`.
- Jeder Eintrag trägt den Hinweis in `notes`.
- Die ausstehende Direktprüfung erscheint im Open-Questions-Report unter
  "Fehlende Quellen".

DoD §17.2 ("Seed-Daten … gegen Primärquellen verifiziert") ist damit **teilweise
erfüllt**: die Angaben sind gegengeprüft und Abweichungen korrigiert, die
Prüfung am Primärtext steht aus.

## Befunde

Die maschinenlesbare Fassung liegt in `src/data/source-verification.ts` und
wird in jeden Open-Questions-Report gerendert.

| ID | §5 | Rechtsakt | Angabe | Ergebnis |
|---|---|---|---|---|
| V-01 | §5.1 | BFSG | In Kraft seit 28.06.2025, keine Übergangsfrist für Neuprojekte | bestätigt |
| V-02 | §5.1 | BFSG | WCAG 2.1 AA ist zu berücksichtigen | offen |
| V-03 | §5.1 | BFSG | Barrierefreiheitserklärung im Footer ist Pflicht | korrigiert |
| V-04 | §5.2 | AI Act | Art. 50 greift seit August 2025 | **korrigiert** |
| V-05 | §5.2 | AI Act | Schrittweise Anwendbarkeit 2025–2027 | offen |
| V-06 | §5.3 | Data Act | Anwendbar seit September 2025 | bestätigt |
| V-07 | §5.4 | — | DSK als Quellsystem | offen |

### V-04 im Detail

Die Spezifikation nennt August 2025 für die Transparenzpflichten nach Art. 50
VO (EU) 2024/1689. Nach Art. 113 gilt Art. 50 ab dem **02.08.2026**. Der
02.08.2025 betrifft andere Bestimmungen der Verordnung, unter anderem die
Pflichten für GPAI-Modelle — das ist die wahrscheinliche Quelle der
Verwechslung.

Umsetzung im Seed: `applicableDate: "2026-08-02"`,
`reviewStatus: "needs_legal_review"`, Hinweis in `LegalAct.summary`.

### V-03 im Detail

§ 14 Abs. 1 Nr. 2 BFSG i. V. m. Anlage 3 Nr. 1 verlangt, die Informationen über
die Barrierefreiheit der Dienstleistung zu erstellen und in barrierefreier Form
**öffentlich zugänglich** zu machen. Die Platzierung im Footer ist gängige
Umsetzung, aber keine gesetzliche Vorgabe. Das Modell führt sie deshalb als
`LegalTextSlot.placement: "footer"` — eine Konfiguration, keine Pflicht.

### V-07 im Detail

`SourceRecord.sourceSystem` sieht "DSK" vor, es wurde jedoch kein DSK-Dokument
erfasst. Eine Quelle zu erfinden wäre nach §3 Nicht-Ziel 3 und §12.2
unzulässig. Ob eine einschlägige Orientierungshilfe existiert, ist im
Open-Questions-Report gelistet.

## Wiederholung der Prüfung

Bei jeder Aktualisierung der Seed-Daten:

1. `SPEC_VERIFICATION_FINDINGS` in `src/data/source-verification.ts` anpassen.
2. `retrievedAt` und `confidence` der betroffenen `SourceRecord`s aktualisieren.
3. `npm run validate && npm test && npm run reports` ausführen.
