# Abdeckung der Definition of Done (§17)

| # | DoD-Kriterium | Umsetzung | Nachweis |
|---|---|---|---|
| 1 | Vollständiges Datenmodell inkl. `LegalActSlug` und zwei getrennten Zustandsmaschinen | `src/domain/types.ts`, `src/domain/slugs.ts`, `src/domain/lifecycle-states.ts` | `tests/schema.test.ts`, `tests/lifecycle.test.ts`, `tests/control-state.test.ts` |
| 2 | Seed-Daten für BFSG, AI Act, Data Act, gegen Primärquellen verifiziert | `src/data/seed.ts`, `src/data/source-verification.ts` | `docs/source-verification.md`, `tests/reports.test.ts` — **teilweise erfüllt**, siehe unten |
| 3 | Quellenreferenzen modelliert | `SourceRecord`, `LegalAct.sourceRecords`, `Obligation.sourceRecords` | `tests/schema.test.ts`, `tests/policy.test.ts` |
| 4 | Beide Zustandsmaschinen existieren und sind getrennt getestet | `src/state/legal-act-lifecycle.ts`, `src/state/control-implementation.ts` | `tests/lifecycle.test.ts` (10 Tests), `tests/control-state.test.ts` (10 Tests) |
| 5 | Applicability Engine inkl. Ableitung §8.4 | `src/engine/applicability.ts` | `tests/applicability.test.ts` |
| 6 | Roadmap Engine inkl. Priorisierung §9.3 und Fristenlogik §9.5 | `src/engine/roadmap.ts` | `tests/roadmap.test.ts` |
| 7 | Checklisten generierbar | `src/engine/checklist.ts` | `tests/checklist.test.ts` |
| 8 | UI-Slots referenzieren ausschließlich `LegalTextSlot`, keine eigenen Statusfelder | `src/ui/slots.tsx`, `src/ui/LegalTextRenderer.tsx` | `tests/content-integrity.test.tsx` |
| 9 | Keine finalen Rechtstexte erfunden | Alle Seed-Slots `status: "empty"`, `textSource: "not_set"`; Renderer liefert ohne `approvedContent` nur Platzhalter | `tests/content-integrity.test.tsx` |
| 10 | Tests definiert und ausführbar, inkl. §13.2/§13.3/§13.5 | `tests/` (11 Dateien) | `npm test` |
| 11 | Offene rechtliche Punkte als `needs_legal_review` markiert | `Obligation.needsLegalReview`, `ApplicabilityAssessment.needsLegalReview`, `LegalAct.reviewStatus` | `reports/open-questions.md` |
| 12 | AuditTrail deckt `source_record` und `applicability_assessment` ab | `src/audit/audit-trail.ts`, `src/audit/store.ts` | `tests/audit.test.ts`, `tests/policy.test.ts` |
| 13 | Markdown-Report erzeugbar | `src/reports/markdown-roadmap.ts` | `reports/roadmap.md`, `tests/reports.test.ts` |
| 14 | JSON-Struktur erzeugbar | `src/reports/json-export.ts` | `reports/regulatory-data.json`, `tests/reports.test.ts` |
| 15 | Open Questions Report erzeugbar | `src/reports/open-questions.ts` | `reports/open-questions.md`, `tests/reports.test.ts` |

## Einschränkung zu Kriterium 2

Die Gegenprüfung wurde durchgeführt und hat eine Abweichung in §5.2 korrigiert
(Befund V-04), sie konnte aber nicht am Primärtext erfolgen, weil der direkte
Abruf von EUR-Lex und gesetze-im-internet.de in der Erstellungsumgebung durch
die Netzwerk-Policy blockiert war. Alle `SourceRecord`s tragen deshalb
`confidence: "medium"` und die ausstehende Direktprüfung ist im
Open-Questions-Report gelistet. Details: `docs/source-verification.md`.

## Abdeckung der Audit-Findings aus §0

| Finding | Umsetzung |
|---|---|
| F-01 | Zwei getrennte Zustandsmengen und Maschinen; Schema-Prüfung schlägt an, wenn ein Rechtsakt-Zustand in `implementationState` auftaucht |
| F-02 | `LegalActSlug` als Union, `isLegalActSlug`, Schema-Prüfung auf `LegalAct.slug` |
| F-03 | `deriveApplicabilityLabel` mit Tabellentest über alle sechs Zeilen |
| F-04 | `src/time/clock.ts` (ISO-8601, `Europe/Berlin`), `deriveDeadlineHint` mit Prioritätsreihenfolge |
| F-05 | `AuditTargetType` erweitert; `RegulatoryStore` protokolliert jede Mutation; Policy-Test prüft Vollständigkeit |
| F-06 | `preReviewState` + Freigabezwang in `transitionLegalAct`; Policy-Test auf verlassene Reviews |
| F-07 | `blocked` in `ImplementationTask.state`; im Seed belegt |
| F-08 | `decidePriority` als geordnete Liste mit `PriorityDecision.rule` |
| F-09 | `pruefgegenstand()` setzt `applicable:true`, `confidence:"low"`, `needsLegalReview:true` |
| F-10 | Slot-Komponenten haben keine eigenen Statusfelder, nur `slots`, `slotKey`, `approvedContent` |
| F-11 | `isSlotReleaseCompliant` im Renderer, in der Roadmap, im Checklisten-Status, im Store und im Policy-Test |
| F-12 | Expliziter Guard in Regel 1 mit eigenem Test |
| F-13 | `supersededBy`, `currentAssessment`, `RegulatoryStore.supersedeAssessment`, Seed-Beispiel |
| F-14 | `RoadmapItem.complianceControlId`, `leastAdvancedState`, `groupControlsForRoadmap` |
| F-15 | Quellenpflicht testseitig, dokumentiert in IN-01 |
| F-16 | `reviewedBy`/`reviewedAt` auf `ApplicabilityAssessment`, als offener Punkt im Report |
