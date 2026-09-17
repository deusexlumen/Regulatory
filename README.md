# Regulatory Roadmap & Compliance Engineering Module

Implementierung von **SPEC v2 — Regulatory Roadmap & Compliance Engineering
Module**.

> **Kein Rechtsberatungssystem.** Das Modul ist ein technisches Steuerungs- und
> Vorbereitungssystem: legislative Frühbeobachtung, Projektrelevanzprüfung,
> Fristensteuerung, Architekturvorbereitung, Rechtstext-Slot-Verwaltung,
> Roadmap- und Checklist-Generierung, Audit- und Nachweisvorbereitung. Es trifft
> keine rechtsverbindliche Bewertung, erzeugt keine finalen Rechtstexte und
> erfindet keine Fristen (§1, §3).

## Schnellstart

```bash
npm install
npm run check      # typecheck + Policy-Gate + Tests
npm run reports    # erzeugt reports/*.md und reports/*.json
```

Einzelne Schritte:

| Befehl | Zweck |
|---|---|
| `npm run typecheck` | TypeScript im Strict-Modus |
| `npm run validate` | Schema- und Policy-Prüfungen (§13.1/§13.2) gegen die Seed-Daten, Exit-Code 1 bei Verstoß |
| `npm test` | Vollständige Testsuite (§13) |
| `npm run reports -- --date 2026-09-16` | Reports mit festem Stichtag, reproduzierbar |
| `npm run reports -- --profile profile-brochure-site` | Nur ein Projektprofil |

## Aufbau

```
src/
  domain/      §6  Datenmodell, LegalActSlug, Zustandsmengen, Dataset-Helfer
  time/        §9.5 ISO-8601, Zeitzone Europe/Berlin, injizierbarer Clock
  state/       §7.1–§7.3 Rechtsakt-Lifecycle · §7.4 Control-Implementierung
  audit/       §14 AuditTrail und schreibender Store mit Audit-Zwang
  engine/      §8 Applicability · §9 Roadmap · §10 Checklisten
  policy/      §13.1/§13.2 Schema- und Policy-Prüfungen
  ui/          §11 LegalTextRenderer und die drei Slot-Views
  reports/     §15 Markdown-Roadmap, JSON-Export, Checklisten, Open Questions
  data/        §16 Schritt 1/3/4: Profile, Seed, Gegenprüfungsprotokoll
tests/         §13 Schema, Policy, Roadmap, Accessibility, Content-Integrity …
scripts/       CLI: validate, generate-reports
reports/       Generierte Artefakte (§15)
docs/          Interpretationsnotizen, Quellenprüfung, DoD-Abdeckung
```

## Die zwei Zustandsmaschinen

Sie sind getrennt und dürfen nicht vermischt werden (§4.3, F-01):

- **`LegalAct.lifecycleState`** (§7.1) — Reifegrad eines Rechtsakts.
  `observed → draft → adopted → published → in_force → transition_period →
  applicable`, dazu `any → superseded | repealed | blocked | needs_legal_review`.
  Der Ausgang aus `needs_legal_review` ist ausschließlich die Rückkehr in
  `preReviewState` und verlangt einen `AuditEntry` mit `action: "approve"` und
  `actor: "legal_reviewer"` (§7.3, F-06).
- **`ComplianceControl.implementationState`** (§7.4) — technischer
  Umsetzungsfortschritt. `not_started → prepared → in_progress → needs_review →
  implemented`, dazu `any → blocked` und `blocked → in_progress`.

`blocked` existiert in beiden Maschinen; alle anderen Zustände sind exklusiv.

## Datenfluss

```
ProjectProfile ─┐
                ├─► ApplicabilityAssessment ─► RoadmapItem
LegalAct ───────┘        (§8, §8.4)              (§9)
   │                                               ▲
   ├─► SourceRecord (§4.1)                         │
   └─► Obligation ─► ComplianceControl ────────────┘
                        │        (§7.4, §9.6)
                        ├─► ImplementationTask
                        ├─► LegalTextSlot ─► LegalTextRenderer (§11)
                        └─► EvidenceArtifact (§4.7)
```

Jede Mutation über `RegulatoryStore` erzeugt einen `AuditEntry` (§14.1).

## Was das Modul bewusst nicht tut

- Es erzeugt **keine Rechtstexte.** Alle Seed-Slots stehen auf `status: "empty"`
  und `textSource: "not_set"`. Der `LegalTextRenderer` nimmt freigegebene Texte
  ausschließlich als Prop entgegen und rendert sie nur, wenn `status ===
  "approved"` **und** `approvedBy`, `approvedAt` sowie eine Quellenreferenz
  gesetzt sind (§6.9, §12.3, F-11).
- Es **rät keine Fristen.** Lässt sich kein `deadlineHint` aus
  `transitionEnd → applicableDate → effectiveDate` ableiten, bleibt das Feld
  leer und der Blocker wird benannt (§9.4.1).
- Es **verschleiert keine Unsicherheit.** Jede fehlende Quelle, jede unklare
  Anwendbarkeit, jede fehlende Freigabe landet im Open-Questions-Report (§15.4).

## Verwendung

```ts
import {
  seedDataset,
  buildRoadmap,
  generateAllChecklists,
  renderOpenQuestions,
  fixedClock,
} from "./src/index.js";

const clock = fixedClock("2026-09-16");           // oder systemClock
const roadmap = buildRoadmap(seedDataset, "profile-demo-shop", { clock });
const checklists = generateAllChecklists(seedDataset, "profile-demo-shop");
const openQuestions = renderOpenQuestions(seedDataset, "profile-demo-shop", { clock });
```

Eigene Daten statt des Seeds:

```ts
import { RegulatoryStore, emptyDataset, fixedClock } from "./src/index.js";

const store = new RegulatoryStore({ dataset: emptyDataset(), clock: fixedClock("2026-09-16") });
store.addSourceRecord({ /* … */ });   // erzeugt automatisch einen AuditEntry
store.addLegalAct({ /* … */ });
const dataset = store.snapshot();
```

## Stand der regulatorischen Daten

Die Angaben aus §5 sind **Arbeitsstand**. Die nach §16 Schritt 4 geforderte
Gegenprüfung wurde durchgeführt und hat eine Abweichung korrigiert: die
Transparenzpflichten nach Art. 50 AI Act gelten nach Art. 113 ab dem
**02.08.2026**, nicht seit August 2025. Der direkte Abruf der Primärtexte war in
der Erstellungsumgebung durch die Netzwerk-Policy blockiert; alle
`SourceRecord`s tragen deshalb `confidence: "medium"`, und die Direktprüfung ist
als offener Punkt gelistet.

Details: [`docs/source-verification.md`](docs/source-verification.md).

## Weitere Dokumentation

- [`docs/interpretation-notes.md`](docs/interpretation-notes.md) — wie
  mehrdeutige Spec-Stellen aufgelöst wurden (IN-01 bis IN-11)
- [`docs/source-verification.md`](docs/source-verification.md) — Protokoll der
  Quellenprüfung
- [`docs/spec-coverage.md`](docs/spec-coverage.md) — Abdeckung der Definition of
  Done (§17) und der Audit-Findings (§0)
