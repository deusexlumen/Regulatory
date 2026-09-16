# Interpretationsnotizen

SPEC v2 ist an einigen Stellen mehrdeutig oder enthält zwei Aussagen, die sich
nicht gleichzeitig wörtlich umsetzen lassen. Jede Auflösung ist hier
dokumentiert, damit sie überprüfbar und nicht stillschweigend ist (§3
Nicht-Ziel 9).

## IN-01 — Quellenpflicht bleibt testseitig (§4.1, F-15)

`sourceRecords: string[]` erlaubt weiterhin ein leeres Array. Die Pflicht wird
über `validateSchema`/`validatePolicies` (`src/policy/validate.ts`) und das
CLI-Gate `npm run validate` geprüft, nicht über den Typ. Konsequenz wie in der
Spec beschrieben: ein `LegalAct` ohne Quelle ist erzeugbar, aber nicht
releasefähig.

## IN-02 — Priorität bei `applicability: "needs_legal_review"` (§9.3)

§9.3 verlangt zweierlei, das sich wörtlich widerspricht:

- Vorbedingung: jede Stufe über `low` setzt
  `applicability ∈ {applicable, possibly_applicable}` voraus — `needs_legal_review`
  ist darin nicht enthalten.
- Nachsatz: bei `needs_legal_review` gilt `legalReviewRequired: true`
  *"unabhängig von der unten ermittelten Priorität"* — es wird also sehr wohl
  eine Priorität ermittelt.

**Auflösung:** Für die Vorbedingung wird das darunterliegende Assessment
ausgewertet, mit ausgeblendetem `needsLegalReview`
(`effectiveApplicabilityForPrioritisation`). Ein Item, das nur wegen des
Review-Bedarfs als `needs_legal_review` gelabelt ist, behält damit die
Priorität, die seine Anwendbarkeit und Frist ergeben, und trägt zusätzlich
`legalReviewRequired: true`. Ist die zugrunde liegende Bewertung
`applicable: false`, bleibt die Priorität `low`.

## IN-03 — Keine Frist im Entwurfsstadium (§9.4.1 vs. §9.5.3)

§9.5.3 leitet `deadlineHint` aus `transitionEnd → applicableDate →
effectiveDate` ab. §9.4.1 verbietet, eine nicht bestätigte Frist zu behaupten.
In `observed` und `draft` sind die Datumsangaben eines Rechtsakts noch nicht
bestätigt.

**Auflösung:** `deriveDeadlineHint` liefert in diesen beiden Zuständen
`undefined`. Ab `adopted` greift die Prioritätsreihenfolge aus §9.5.3
unverändert.

## IN-04 — Regel 2 ohne gesetzten `deadlineHint` (§9.3 vs. §9.5.4)

§9.3 Regel 2 verknüpft "Frist unter 180 Tagen" **und** die übrigen Bedingungen
mit `und`. §9.5.4 hält dagegen fest, dass Regel 2 ohne gesetzten `deadlineHint`
"über die anderen Bedingungen dennoch greifen" kann.

**Auflösung:** Das Fristentor ist offen, wenn entweder eine Frist existiert und
unter 180 Tagen liegt, **oder** keine Frist bekannt ist. Im Entwurfsstadium
bleibt es geschlossen, weil §9.4.4 dort ausschließlich Architekturvorbereitung
zulässt — solche Items landen über Regel 3/4 bei `medium`/`low` und tragen
`architecturePreparationRequired: true`.

## IN-05 — Splitkriterium in §9.6

§9.6 erlaubt das Aufsplitten in mehrere `RoadmapItem`s, wenn Kontrollen
"erkennbar unterschiedliche Fristen oder Verantwortlichkeiten" haben, ohne den
Begriff zu operationalisieren.

**Auflösung:** Gruppierungsschlüssel ist
`ownerRole` + frühester `dueHint` der zugehörigen `ImplementationTask`s. Ergibt
sich genau eine Gruppe, entsteht ein zusammengefasstes Item nach der Regel
"ungünstigster Zustand gewinnt"; sonst je Gruppe ein Item.

## IN-06 — Wann `complianceControlId` gesetzt wird (F-14)

Ein `RoadmapItem` referenziert genau dann eine Kontrolle, wenn seine Gruppe
genau eine Kontrolle enthält. Ein zusammengefasstes Item lässt das Feld leer —
es steht für mehrere Kontrollen, und der maßgebliche Zustand ist der
ungünstigste unter ihnen (nachlesbar über `RoadmapDiagnostics.worstControlState`).

## IN-07 — Checkliste für nicht anwendbare Regulierungen (§10 vs. §15.3)

§8.3 Regel 6 verbietet Umsetzungsaufgaben für nicht anwendbare Regulierungen,
§15.3 verlangt aber immer drei Checklisten.

**Auflösung:** Die Checkliste wird erzeugt, enthält keine Punkte und trägt
`skippedReason` mit der Begründung aus dem Assessment. Die Nichtanwendbarkeit
wird damit sichtbar, statt als fehlender Abschnitt zu verschwinden.

## IN-08 — `LegalTextSlot` trägt keinen Text

Das Domänenmodell in §6.9 hat kein Inhaltsfeld; Inhalte hängen an
`sourceReference`/`externalReference`. Der `LegalTextRenderer` nimmt den
freigegebenen Text deshalb als `approvedContent`-Prop vom Anwendungscode
entgegen. Das Modul liefert keinen Rechtstext mit — auch keinen Beispieltext
(§3 Nicht-Ziel 2, §12.2). Fehlt der Inhalt trotz gültiger Freigabe, rendert der
Renderer weiterhin einen Platzhalter mit
`data-legal-slot-pending-reason="content_missing"`.

## IN-09 — `blocked` gehört zu beiden Zustandsmaschinen

`blocked` kommt sowohl in `RegulatoryLifecycleState` (§7.1.1) als auch in
`ControlImplementationState` (§7.4) vor. Die Schema-Prüfung gegen Vermischung
(F-01) schlägt deshalb nur bei Zuständen an, die *ausschließlich* zur
Rechtsakt-Maschine gehören.

## IN-10 — Eindeutigkeit des gültigen Assessments (§6.6)

Die Aktualitätsregel nennt nur "jüngstes `assessedAt` ohne `supersededBy`".
Bei identischem `assessedAt` entscheidet zusätzlich die lexikografisch größere
`id`, damit das Ergebnis deterministisch bleibt. Mehr als ein nicht abgelöstes
Assessment je `(legalActId, projectProfileId)` gilt als Policy-Verstoß und wird
von `validatePolicies` gemeldet.

## IN-11 — Korrektur der Arbeitsstand-Angabe zu Art. 50 AI Act (§5.2)

Die Gegenprüfung nach §16 Schritt 4 hat die Angabe "Transparenzpflichten nach
Art. 50 greifen seit August 2025" nicht bestätigt. Der Seed trägt das geprüfte
Datum `2026-08-02`; die Abweichung ist in `docs/source-verification.md` und im
Open-Questions-Report als Befund V-04 ausgewiesen, und der Rechtsakt steht auf
`reviewStatus: "needs_legal_review"`.
