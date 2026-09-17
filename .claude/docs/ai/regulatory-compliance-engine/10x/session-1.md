# 10x Analyse: Regulatory Roadmap & Compliance Engineering Module
Session 1 | Datum: 2026-09-17 | Stand: Commit `3a99998`, SPEC v2

> Strategiedokument. Kein Implementierungsauftrag, kein Code. Sprache Deutsch,
> passend zur übrigen Repo-Dokumentation.

## Aktueller Wert

**Was das Produkt heute leistet:** Es bildet drei Rechtsakte (BFSG, EU AI Act,
EU Data Act) als typisiertes Domänenmodell ab, bewertet sie deterministisch
gegen ein Projektprofil aus 16 Booleans, leitet Pflichten → Kontrollen →
Aufgaben → Rechtstext-Slots ab und erzeugt vier Reports (Roadmap, Checklisten,
Open Questions, JSON). Jede Mutation erzwingt einen `AuditEntry`
(`src/audit/store.ts`), jede Unsicherheit landet sichtbar im
Open-Questions-Report.

**Die eigentliche Stärke, unterschätzt:** Die Engine ist **rein und
deterministisch**. `buildRoadmapResult` ist eine Funktion von
(Dataset, Profil, Clock) → Roadmap, und `decidePriority` gibt mit
`PriorityDecision.rule`/`.explanation` seine eigene Begründung mit heraus
(`src/engine/roadmap.ts`). Das ist kein Detail — es ist die Lizenz für alles,
was unten unter „What-if", „Delta" und „CI-Gate" steht. Diese Features sind
hier fast geschenkt, weil die Engine beliebig oft mit variierten Eingaben
laufen kann.

**Was es ausdrücklich nicht leistet (und nicht leisten soll):** Keine
Rechtsberatung, keine erfundenen Rechtstexte, keine geratenen Fristen (§1, §3).
Diese Disziplin ist ein Aktivposten, kein Hindernis — sie ist der Grund, warum
man dem Output überhaupt trauen kann. Jeder Vorschlag unten respektiert sie.

**Wer nutzt es und warum:** Heute niemand außerhalb des Repos. Der implizite
Nutzer ist ein Entwickler oder technischer Projektleiter eines deutschen
Webprojekts, der wissen muss, was BFSG/AI Act/Data Act für seinen Code
bedeuten — und der das Ergebnis gegenüber einem Auditor oder Kunden belegen
können muss.

**Die Kernaktion:** `npm run reports` → Markdown lesen → Aufgaben abarbeiten.

---

## Die Frage

Was würde dieses Modul 10x wertvoller machen?

Die ehrliche Antwort beginnt mit einem Befund aus den generierten Reports
selbst.

---

## Befund vorab: die Priorisierung trägt heute null Information

Gemessen in `reports/` (Stichtag 2026-09-16):

| Profil | Items | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| `profile-demo-shop` | 12 | **12** | 0 | 0 | 0 |
| `profile-brochure-site` | 8 | **8** | 0 | 0 | 0 |

**20 von 20 Items sind CRITICAL.** Die Ursache ist mechanisch und liegt in
`src/time/clock.ts`:

```ts
export function isWithinDays(deadline, days, clock): boolean {
  const remaining = daysUntil(deadline, clock);
  return remaining !== undefined && remaining < days;   // −445 < 90 → true
}
```

Alle drei Seed-Fristen liegen in der Vergangenheit (BFSG 2025-06-28, AI Act
2026-08-02, Data Act 2026-09-12). Eine seit 445 Tagen überfällige Frist erfüllt
„liegt weniger als 90 Tage in der Zukunft" genauso wie eine, die morgen greift.
Regel 1 aus §9.3 feuert deshalb ausnahmslos.

**Gegenprobe mit einem Stichtag vor allen Fristen** (`npm run reports --
--date 2025-01-01`) — gleicher Datensatz, gleicher Umsetzungsstand, nur die
Uhr verstellt:

| Profil | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| `profile-demo-shop` | 0 | 4 | 0 | **8** |
| `profile-brochure-site` | 0 | 4 | 0 | **4** |

Das präzisiert den Befund erheblich. Die Engine *kann* differenzieren — aber
ihr Ergebnis hängt fast ausschließlich am Kalender, nicht am Zustand der
Arbeit. Dieselben Items, dieselben fehlenden Rechtstexte, dieselben Blocker:
einmal 20 × CRITICAL, einmal 0 × CRITICAL und 12 × LOW.

Drei Konsequenzen, alle teuer:

1. **Das Kernversprechen ist am Stichtag heute leer.** Der README verspricht
   eine „priorisierte Umsetzungsroadmap". Eine Liste, in der alles kritisch
   ist, ist eine unsortierte Liste. Der Nutzer muss die Priorisierung im Kopf
   nachbauen — also genau die Arbeit tun, für die er das Tool geholt hat.
2. **Am anderen Stichtag ist die Priorisierung invertiert.** Items mit
   `not_started`-Kontrollen und fehlendem, extern zu beschaffendem Rechtstext
   fallen auf LOW, sobald die Frist weiter als 180 Tage entfernt ist. Genau
   diese Items haben die längste Vorlaufzeit — eine Kanzleifreigabe dauert
   Wochen bis Monate. Das Tool stuft sie herunter, solange man noch handeln
   kann, und auf CRITICAL hoch, wenn es zu spät ist. Priorität sollte
   Vorlaufzeit gegen Restzeit rechnen; heute rechnet sie nur Restzeit.
3. **Die Informationswebsite bekommt 8 kritische Aufgaben.** Und zwar für
   BFSG und Data Act, die die Engine selbst als `possibly_applicable` bei
   `confidence: "low"` einstuft (Prüfgegenstand-Regel, §8.3 Regel 2/3). Das
   Profil ohne Shop, ohne KI, ohne vernetztes Produkt bekommt maximale
   Alarmstufe für Pflichten, deren Anwendbarkeit das System ausdrücklich
   offenlässt. Das ist die Nutzergruppe, die am ehesten aufgibt — und sie
   bekommt das schlechteste Erlebnis.

**Nebenbefund:** MEDIUM kommt in keinem der vier Läufe je vor. Regel 3 (§9.3)
verlangt `lifecycleState ∈ {adopted, published}`; alle drei Seed-Rechtsakte
stehen auf `applicable`. Die Regel ist für diesen Datensatz strukturell tot,
die Skala also faktisch dreistufig.

Der Fix ist klein (siehe „Do Now"). Er ist deshalb die höchstwertige einzelne
Änderung im ganzen Dokument: Er kostet wenig und stellt das Versprechen wieder
her, auf dem alles andere aufbaut.

---

## Massive Opportunities

### 1. Der Regulierungs-Feed: vom Schnappschuss zum lebenden System

**Was:** Ein Ingestion-Layer, der EUR-Lex und DIP (beide bereits als
`SourceRecord.sourceSystem` modelliert, `src/domain/types.ts`) periodisch
abfragt, neue oder geänderte Rechtsakte als `SourceRecord` + `LegalAct` im
Zustand `observed` anlegt und den Lifecycle-Übergang vorschlägt — niemals
automatisch vollzieht.

**Warum 10x:** Der README verspricht als erstes Feature „legislative
Frühbeobachtung". Es existiert kein Codepfad, der irgendeine Quelle abruft.
`src/data/seed.ts` sind 743 handgeschriebene Zeilen für drei Rechtsakte. Damit
ist das Produkt heute eine Momentaufnahme vom Erstellungstag, die ab Tag zwei
veraltet — und der Nutzer merkt es nicht, weil nichts ihm sagt, dass sie
veraltet ist. Ein Compliance-Tool ohne Feed ist ein PDF mit Build-Schritt.

**Unlocks:** Alles darunter. Delta-Reports brauchen eine zweite Beobachtung.
Die Frühwarnung („Referentenentwurf X berührt euren Chatbot") ist das einzige
Feature, für das jemand aus eigenem Antrieb wiederkommt. Und es ist der
Mechanismus, der aus einem Einmal-Audit ein Abonnement macht.

**Effort:** Hoch. Netzwerk, Parser je Quelle, Scheduling, Dedup, ein
Review-Workflow für Vorschläge.

**Risk:** Die größte Gefahr ist nicht technisch, sondern inhaltlich: Ein
automatisch angelegter Rechtsakt mit falsch geparstem `applicableDate`
verletzt §3 („erfindet keine Fristen") härter als jede fehlende Angabe. Die
Architektur muss den Feed strikt als Vorschlagsgenerator behandeln: neue Objekte
entstehen in `observed` mit `confidence: "low"` und `reviewStatus:
"needs_legal_review"`, Datumsfelder nur bei eindeutigem Treffer, sonst leer.
Die bestehende Zustandsmaschine (§7.1) kann das exakt — sie ist dafür gebaut.

**Score:** 🔥 Must do — aber nach dem Fundament unten. Ein Feed, der in eine
kaputte Priorisierung einspeist, vervielfacht nur das Rauschen.

---

### 2. Das Repo ist die Eingabe: Profil und Kontrollen aus dem Code ableiten

**Was:** Ein Analyzer, der ein Ziel-Repository liest und (a) den
`ProjectProfile` vorschlägt, (b) jeden `ComplianceControl.targetModule` gegen
die Realität prüft.

Zu (a): Die 16 Booleans in `src/domain/types.ts` sind fast alle aus einem
Web-Repo detektierbar — `hasPayment` aus Stripe/PayPal-Abhängigkeiten,
`hasAnalytics` aus GA/Matomo/Plausible, `hasAiChatbot` aus `@anthropic-ai/*`,
`openai`, `@google/genai`, `hasUserAccounts` aus Auth-Bibliotheken oder
Session-Middleware, `isECommerce` aus Cart-/Checkout-Routen.

Zu (b): `targetModule` trägt im Seed **bereits echte Pfade mit
Export-Anker** — `"src/ui/slots.tsx#AccessibilityStatementSlot"`,
`"tests/accessibility.test.tsx"`, `"backend/logging"`. Nichts prüft je, ob
diese Datei existiert, ob der Export existiert, ob die Komponente irgendwo
gerendert wird. Eine Kontrolle kann auf `implemented` stehen, während die
Datei gelöscht wurde.

**Warum 10x:** Das löst gleichzeitig das Adoptions- und das
Vertrauensproblem.

*Adoption:* Heute ist der erste Schritt „fülle 16 Booleans korrekt aus". Das
ist eine Hürde, bei der jeder Fehler das gesamte Ergebnis verfälscht, und der
Nutzer hat keine Rückmeldung darüber, ob er richtig geantwortet hat. Nach dem
Analyzer ist der erste Schritt „zeig auf dein Repo". Time-to-first-value fällt
von zwanzig Minuten unsicherer Selbstauskunft auf einen Befehl.

*Vertrauen — und das ist der größere Teil:* Compliance-Dokumentation zerfällt
immer auf dieselbe Weise. Sie wird einmal erstellt, der Code läuft weiter, und
nach sechs Monaten beschreibt sie ein System, das es nicht mehr gibt. Ein
Modell, das gegen den Code verifiziert wird, zerfällt nicht still. Es meldet
sich.

**Unlocks:** Drift-Erkennung („Kontrolle `ctl-bfsg-statement-slot` steht auf
`implemented`, aber `AccessibilityStatementSlot` wird in keiner Route mehr
gerendert"), automatische Neubewertung bei Profiländerung („dieser PR fügt
`openai` hinzu — der AI Act wechselt von `not_applicable` auf `applicable`,
3 neue Pflichten"), und damit der gesamte CI-Anwendungsfall (#3).

**Effort:** Mittel bis hoch. Dependency-Scan und Dateiexistenz sind einfach;
verlässliche Render-Erkennung ist AST-Arbeit und muss ehrlich über ihre
Grenzen sein.

**Risk:** Falsch-negative Profilsignale sind gefährlich — ein nicht erkannter
Chatbot bedeutet eine nicht erkannte AI-Act-Pflicht. Deshalb: Der Analyzer
setzt nie `false`. Er setzt `true` bei Fund und lässt sonst „unbestätigt"
stehen, das wie heute in die Prüfgegenstand-Regel läuft. Nie stillschweigend
verneinen — genau das Prinzip, das `assessAiAct` bereits verkörpert.

**Score:** 🔥 Must do. Das ist der defensivste Vorschlag im Dokument: Ein
generischer Fragebogen ist an einem Nachmittag kopiert. Ein System, das die
Verbindung zwischen Regulierung und konkreter Codezeile hält und über die Zeit
pflegt, ist es nicht.

---

### 3. Compliance als Build-Artefakt: CI-Gate und automatische Nachweise

**Was:** Ein CI-Modus, der bei jedem PR die Roadmap gegen den Vorzustand
rechnet und (a) den Diff als PR-Kommentar postet, (b) mit Exit-Code fehlschlägt,
wenn ein neues CRITICAL-Item entsteht oder eine Kontrolle zurückfällt,
(c) Testergebnisse automatisch als `EvidenceArtifact` erfasst.

Zu (c): Die Zutaten liegen bereit. `axe-core` ist Abhängigkeit,
`tests/accessibility.test.tsx` läuft, und der Seed führt
`ev-bfsg-axe-baseline` als `accessibility_report` mit Status `"collected"`.
Dieser Nachweis wird heute von Hand eingetragen. Er könnte bei jedem grünen
Lauf mit Commit-SHA und Zeitstempel selbst entstehen.

**Warum 10x:** Es verlegt Compliance von „Aktivität, an die man sich erinnern
muss" nach „Eigenschaft, die der Build hat". `npm run validate` beendet sich
bereits mit Exit-Code 1 bei Policy-Verstoß (`scripts/validate.ts`) — das Gate
ist als Primitiv vorhanden, nur nie auf Compliance-Regression angewandt.

**Unlocks:** Der Audit-Trail wird beiläufig vollständig, statt nachträglich
rekonstruiert. Nach einem Jahr existiert eine lückenlose, commit-verankerte
Historie „wer hat wann was auf welcher Quelle freigegeben" — das Artefakt, das
im Audit tatsächlich zählt und das man nicht nachträglich herstellen kann. Der
Wert wächst mit jedem Lauf, ohne dass jemand daran denken muss.

**Effort:** Mittel. Reports existieren, Exit-Codes existieren, JSON-Export
existiert. Es fehlen die Vorzustandsspeicherung und das Reporter-Format.

**Risk:** Ein Gate, das falsch rot wird, wird innerhalb von zwei Wochen
deaktiviert. Startwert muss „warnen" sein, Blockieren opt-in und eng auf
unstrittige Fälle begrenzt.

**Score:** 🔥 Must do.

---

### 4. Portfolio-Modus für Agenturen

**Was:** Mehrere Projekte in einer Instanz, ein gemeinsames Fristenboard, ein
Rechtsakt-Update, das gegen alle Profile gleichzeitig durchschlägt: „Der neue
Data-Act-Durchführungsrechtsakt betrifft 7 eurer 23 Projekte — diese hier."

**Warum 10x:** Es verschiebt den Käufer. Ein einzelner Entwickler mit einem
Projekt spart Stunden. Eine Agentur mit vierzig Kundenwebsites hat ein
Bestandsproblem, das sie heute in einer Tabelle verwaltet und nicht lösen kann.
Und die Ökonomie ist die richtige: Die Datenpflege je Rechtsakt fällt **einmal**
an und amortisiert sich über alle Projekte. Genau dieses Verhältnis macht den
Feed (#1) wirtschaftlich tragfähig.

Die Architektur ist bereits nah dran: `projectProfiles` ist ein Array,
`buildRoadmap` nimmt eine `projectProfileId`, `generate-reports.ts` iteriert
schon über Profile. Was fehlt, ist die Aggregation über Profile hinweg statt
nebeneinander.

**Unlocks:** Wiederkehrende Umsätze, Benchmark über Projekte („eure
Barrierefreiheit liegt im untersten Viertel eures Portfolios"), und ein
Weiterverkaufs-Artefakt: der Compliance-Report ans Kundenende.

**Effort:** Mittel bis hoch — vor allem Persistenz und Aggregations-Views, die
heute beide fehlen.

**Risk:** Ohne Mandantentrennung und Zugriffskontrolle nicht auslieferbar.

**Score:** 👍 Strong — nach #1 und #2, denn ohne Feed ist ein Portfolio nur
vervielfachte Veraltung.

---

## Medium Opportunities

### 5. Die Priorisierung reparieren: „überfällig" ist nicht „dringend"

**Was:** Zwei Korrekturen an `decidePriority`.

*Erstens — „überfällig" von „dringend" trennen.* `isWithinDays` vermischt beide.
Drei unterscheidbare Zustände statt einem: **überfällig** (Frist vergangen,
Pflicht gilt bereits, Haftungsrisiko läuft), **dringend** (0–90 Tage),
**anstehend** (90–180 Tage).

*Zweitens — Vorlaufzeit gegen Restzeit rechnen.* Das ist der wichtigere Teil,
und die Messung oben zeigt warum: Heute rechnet Regel 1/2 ausschließlich
Restzeit bis zur Frist. Eine Pflicht, die eine externe Kanzleifreigabe braucht,
ist bei 180 Tagen Restzeit **nicht** entspannt — sie ist knapp. Eine
Konfigurationsänderung bei 30 Tagen ist es. Die nötige Eingabe ist bereits im
Modell: `dependsOnLegalText`, `dependsOnPublication` und `implementationState`
sagen zusammen, wie lang der Vorlauf ist. Priorität sollte
`Restzeit − Vorlaufzeit` sein, nicht `Restzeit`.

Zusätzlich: Wenn alles kritisch wäre, entscheidet eine sekundäre Ordnung nach
Aufwand und Blockierung, welche drei Items *diese Woche* dran sind.

**Warum das mehr zählt, als es aussieht:** Es ist die Differenz zwischen
„hier sind 12 kritische Aufgaben" (unbrauchbar, erzeugt Lähmung) und „3 Pflichten
laufen bereits, 2 davon kannst du heute erledigen, 1 hängt an der Kanzlei"
(handlungsleitend). Der Unterschied ist nicht kosmetisch — es ist der
Unterschied zwischen einem Report, den man liest, und einem, nach dem man
handelt.

**Impact:** Betrifft 100 % der Nutzer bei 100 % der Läufe. Es gibt keinen
höher gehebelten Eingriff in diesem Dokument. Nebeneffekt: Regel 3 (MEDIUM)
sollte bei der Gelegenheit überprüft werden — sie ist an
`lifecycleState ∈ {adopted, published}` gebunden und feuert im gesamten
Seed-Datensatz nie.

**Effort:** Niedrig bis mittel — `decidePriority` ist eine geordnete Regelliste
mit Einzeltests, präzise dafür gebaut, geändert zu werden. Die Reports zeigen
die Überfälligkeit („seit 445 Tagen überfällig") bereits an; die Information
existiert, sie erreicht nur die Priorisierung nicht.

**Achtung:** §9.3 ist Spec-Text. Die Änderung gehört als IN-12 in
`docs/interpretation-notes.md` dokumentiert, nicht still eingebaut. Das Repo
hat dafür bereits die Konvention (IN-01 bis IN-11).

**Score:** 🔥 Must do — zuerst.

---

### 6. Delta-Report: „Was hat sich seit dem letzten Lauf geändert?"

**Was:** Snapshots datieren statt überschreiben, und ein Report, der genau die
Differenz zeigt: neue Pflichten, verschobene Fristen, zurückgefallene
Kontrollen, neu aufgelöste Blocker.

**Warum 10x:** Bei einem wiederkehrenden Compliance-Lauf ist fast der gesamte
Informationsgehalt in der Differenz. Der Bestand ist bekannt; die Änderung ist
die Nachricht. Heute überschreibt `generate-reports.ts` dieselben Dateien, und
der Nutzer muss zwei 400-Zeilen-Markdowns visuell vergleichen — also liest er
sie nicht, und das Tool wird zur Pflichtübung.

Das Substrat ist da: `AuditTrail` protokolliert jede Mutation,
`ApplicabilityAssessment.supersededBy` modelliert Nachfolgebewertungen explizit
(F-13), `renderJsonExport` erzeugt bereits einen vollständigen
Maschinen-Schnappschuss. Es wird nichts davon zum Vergleichen benutzt.

**Impact:** Macht wiederkehrende Nutzung überhaupt sinnvoll. Ohne das ist jeder
Lauf nach dem ersten redundant.

**Effort:** Mittel — im Kern ein strukturierter Diff über zwei JSON-Exporte
plus Renderer.

**Score:** 🔥 Must do.

---

### 7. Der Kanzlei-Anfragesatz

**Was:** Pro nicht freigegebenem `LegalTextSlot` ein versandfertiges Paket:
Normreferenz, Quell-URLs, Platzierung, Projektkontext, konkrete Fragestellung —
plus eine strukturierte Rückgabeform, deren Ausfüllen den Slot samt
`approvedBy`, `approvedAt`, `sourceReference` und `AuditEntry` korrekt füllt.

**Warum 10x:** Es adressiert den einzigen Engpass, den das System heute
vollständig außerhalb seiner Grenzen lässt. Sechs Slots stehen auf `empty`,
jeder erzeugt einen Blocker, jeder Blocker treibt Priorität — und der Weg von
`empty` nach `approved` findet komplett per E-Mail statt. Das System sieht die
Lücke präzise und hilft null dabei, sie zu schließen.

Wichtig für §1/§3: Das Paket enthält **keinen Textvorschlag**. Es stellt die
Frage, es beantwortet sie nicht. Das ist kein Zugeständnis, sondern der Grund,
warum es hier zulässig ist — und beschleunigt trotzdem massiv, weil der
Rechercheaufwand vor der Anfrage der eigentliche Aufwand ist.

**Impact:** Verkürzt die längste Wartezeit im gesamten Prozess.

**Effort:** Mittel.

**Score:** 👍 Strong.

---

### 8. What-if: Anwendbarkeit vor der Implementierung

**Was:** Profil-Deltas gegen die Engine rechnen. „Was passiert, wenn wir einen
KI-Assistenten einbauen?" → 3 neue Pflichten, 2 neue Rechtstext-Slots, frühestes
Datum 2026-08-02.

**Warum 10x:** Es verlegt Compliance nach vorn, ins Product Planning, wo eine
Entscheidung noch kostenlos ist. Heute erfährt das Team von der AI-Act-Pflicht,
nachdem der Chatbot live ist. Damit wird aus einem Prüfwerkzeug ein
Entscheidungswerkzeug — und Entscheidungswerkzeuge werden von anderen Leuten
benutzt als Prüfwerkzeuge.

**Impact:** Erschließt eine neue Nutzergruppe (Produkt/Projektleitung) ohne
neues Datenmodell.

**Effort:** **Niedrig.** `assessAll` und `buildRoadmap` sind reine Funktionen
über ein übergebenes Profil. Ein What-if ist ein zweiter Aufruf mit
verändertem Objekt plus ein Diff (teilt die Mechanik mit #6). Das ist der
Vorschlag mit dem besten Verhältnis von Wirkung zu Aufwand nach #5.

**Score:** 🔥 Must do.

---

### 9. Aufwandsschätzung je Item

**Was:** `ComplianceControl` um eine grobe Aufwandsklasse ergänzen
(`trivial` / `small` / `medium` / `large`), aus `controlType` vorbelegt und
überschreibbar.

**Warum:** Erst Aufwand neben Priorität macht Sequenzierung möglich — „was
schaffen wir vor dem Launch in drei Wochen?". Ohne diese Achse ist jede
Roadmap eine Wunschliste. Ergänzt #5 direkt: Priorität sagt *ob*, Aufwand sagt
*wann*.

**Effort:** Niedrig.

**Score:** 👍 Strong.

---

## Small Gems

### 1. Ampel-Kopfzeile über jedem Report
**Was:** Eine Zeile vor allem anderen: „3 Pflichten überfällig · 4 Fristen in
90 Tagen · 2 technisch blockiert · 6 Freigaben ausstehend."
**Warum stark:** Der heutige Report zwingt jeden Leser, 400 Zeilen zu
überfliegen, bevor er weiß, wie schlimm es steht. Alle vier Zahlen sind bereits
berechnet — sie sind nur über das Dokument verstreut. Zusammenziehen kostet
fast nichts und macht den Report auf einen Blick lesbar.
**Effort:** Sehr niedrig. **Score:** 🔥

### 2. Blocker-Ranking statt Blocker-Liste
**Was:** „Dieser eine Punkt blockiert 7 Items" — Blocker nach Anzahl blockierter
Items sortiert, statt in flacher Liste je Item.
**Warum stark:** `open-questions.md` listet 24 offene Punkte gleichrangig. In
Wahrheit ist einer davon der Pfropfen. Die Daten liegen vor (`blockers[]` an
jedem `RoadmapItem`); es wird nur nie aggregiert. Verwandelt „24 Probleme" in
„fang hier an".
**Effort:** Sehr niedrig. **Score:** 🔥

### 3. Quell-Links in jedem Roadmap-Item
**Was:** `SourceRecord.url` direkt im Item ausgeben statt nur die Normreferenz.
**Warum stark:** Der Report behauptet Pflichten. Die erste Reaktion eines
Skeptikers — Vorgesetzter, Auditor, Kunde — ist „wo steht das?". Heute ist die
Antwort eine manuelle Suche; das Feld ist modelliert und im Seed viermal
gefüllt, erscheint aber nicht im Item. Nachprüfbarkeit auf einen Klick ist bei
einem Tool, das ausdrücklich keine Rechtsberatung sein will, keine Bequemlichkeit
— sie ist das Kernversprechen.
**Effort:** Sehr niedrig. **Score:** 🔥

### 4. Gruppierung nach `ownerRole`
**Was:** Zusätzliche Reportansicht nach Rolle — frontend (8 Items), backend (2),
data (2), content (1), compliance (1).
**Warum stark:** Das Feld ist im Seed durchgängig gepflegt und erscheint in
keinem Report. Niemand liest eine Roadmap, um zu erfahren, was *das Team* tun
muss; jeder liest sie, um zu erfahren, was *er* tun muss. Eine Gruppierung
macht aus einem Dokument fünf Arbeitslisten.
**Effort:** Sehr niedrig. **Score:** 🔥

### 5. Copy-paste-fertiges Slot-Snippet
**Was:** Bei jedem nicht platzierten Slot das konkrete JSX ausgeben:
`<AccessibilityStatementSlot slots={slots} feedbackHref="…" />`.
**Warum stark:** Schließt die letzte Lücke zwischen Report und Editor. Die
Komponenten existieren (`src/ui/slots.tsx`), die `slotKey`-Konvention ist
maschinell auflösbar (`slotKeyFor`) — der Entwickler muss die Verbindung heute
trotzdem selbst herstellen.
**Effort:** Sehr niedrig. **Score:** 👍

### 6. `targetModule`-Existenzprüfung
**Was:** Prüfen, ob die in `targetModule` genannte Datei und der Export nach
`#` existieren. Wenn nicht: Blocker.
**Warum stark:** Billigster Einstieg in Idee #2 — reine Dateisystem- und
Export-Prüfung, kein AST. Fängt die häufigste stille Zersetzung ab: Die
Kontrolle steht auf `implemented`, die Komponente wurde umbenannt.
**Effort:** Niedrig. **Score:** 🔥

### 7. Datierte Report-Archivierung
**Was:** Zusätzlich nach `reports/history/<datum>/` schreiben statt nur zu
überschreiben.
**Warum stark:** Drei Zeilen in `generate-reports.ts`, und der Delta-Report
(#6) hat rückwirkend Daten. Ohne das beginnt jede Historie erst beim Einbau.
**Effort:** Trivial. **Score:** 🔥

### 8. `--fail-on` Flag für `npm run reports`
**Was:** Exit-Code ≠ 0, wenn Items oberhalb einer Schwelle existieren.
**Warum stark:** Eine Flag macht das Tool CI-fähig und ist die Vorstufe zu
Idee #3.
**Effort:** Trivial. **Score:** 👍

### 9. Altersanzeige der Daten
**Was:** Kopfzeile: „Jüngste Quellenprüfung: vor 366 Tagen. Diese Roadmap kann
veraltet sein."
**Warum stark:** `SourceRecord.retrievedAt` ist gepflegt und wird nirgends
ausgewertet. Solange kein Feed existiert (#1), ist das die ehrlichste
verfügbare Aussage — und es ist die einzige Zeile, die den Nutzer davon abhält,
einem alten Schnappschuss blind zu vertrauen. Passt exakt zur Haltung des
Moduls: Unsicherheit sichtbar machen, statt sie zu glätten.
**Effort:** Trivial. **Score:** 🔥

---

## Empfohlene Priorisierung

### Do Now — Fundament, Tage statt Wochen

1. **Priorisierung reparieren** (Medium #5) — Ohne das ist jede weitere
   Investition in Datenqualität verschwendet, weil das Ergebnis am Ende
   immer dieselbe undifferenzierte rote Liste ist. Wirkt auf 100 % der
   Nutzer. Als IN-12 dokumentieren.
2. **Ampel-Kopfzeile + Blocker-Ranking + Quell-Links + Rollen-Gruppierung**
   (Gems #1–#4) — Vier Änderungen an der Renderschicht, keine neuen Daten.
   Zusammen verwandeln sie den Report von einem Nachschlagewerk in ein
   Arbeitsdokument.
3. **Datierte Archivierung + Altersanzeige** (Gems #7, #9) — Trivial, und #7
   ist Voraussetzung dafür, dass der Delta-Report bei Einführung bereits
   Historie hat. Je früher, desto mehr Daten.
4. **`targetModule`-Existenzprüfung** (Gem #6) — Erster echter Brückenschlag
   zwischen Compliance-Modell und Code.

### Do Next — Hebel, Wochen

1. **Delta-Report** (Medium #6) — Macht wiederkehrende Nutzung sinnvoll.
   *Unlocks:* CI-Gate, Feed-Benachrichtigungen.
2. **What-if-Modus** (Medium #8) — Niedriger Aufwand dank reiner Engine,
   erschließt eine neue Nutzergruppe. *Unlocks:* Compliance in der Planung.
3. **CI-Gate + automatische Nachweise** (Massive #3) — Macht Compliance zur
   Build-Eigenschaft. *Unlocks:* selbstbauender Audit-Trail.
4. **Kanzlei-Anfragesatz** (Medium #7) — Kürzt die längste Wartezeit.

### Explore — strategische Wetten

1. **Repo-Analyzer** (Massive #2) — *Warum:* Löst Adoption und Vertrauen
   zugleich. *Risiko:* Falsch-negative Signale; Gegenmittel ist die Regel
   „setzt nie `false`". *Upside:* Der einzige echte Burggraben — das Modell
   bleibt am Code, statt von ihm wegzudriften.
2. **Regulierungs-Feed** (Massive #1) — *Warum:* Löst das versprochene, aber
   nicht existierende Kernfeature ein. *Risiko:* Falsch geparste Fristen
   verletzen §3 direkt; Gegenmittel ist strikter Vorschlagsmodus in
   `observed`/`low`. *Upside:* Macht aus einem Einmal-Audit ein Abonnement.
3. **Portfolio-Modus** (Massive #4) — *Warum:* Verschiebt den Käufer vom
   Entwickler zur Agentur und amortisiert die Datenpflege über n Projekte.
   *Risiko:* Braucht Persistenz und Mandantentrennung, beide fehlen komplett.

### Backlog

1. **Aufwandsschätzung** (Medium #9) — Sinnvoll erst, wenn die Priorisierung
   wieder differenziert (Do Now #1); vorher gibt es nichts zu sequenzieren.
2. **Slot-Snippets** (Gem #5) — Nett, aber der Slot-Einbau ist nicht der
   Engpass; die Rechtstext-Freigabe ist es.
3. **`--fail-on` Flag** (Gem #8) — Geht im CI-Gate (Do Next #3) ohnehin auf.

---

## Fragen

### Beantwortet

- **F:** Warum sind alle 20 Roadmap-Items CRITICAL?
  **A:** `isWithinDays` behandelt überfällige Fristen als „innerhalb von
  90 Tagen" (`remaining < days`, mit `remaining = −445`). Da alle drei
  Seed-Fristen in der Vergangenheit liegen, greift §9.3 Regel 1 ausnahmslos.
- **F:** Warum bekommt die Informationswebsite 8 kritische Items, obwohl kaum
  etwas anwendbar ist?
  **A:** Die Prüfgegenstand-Regel (§8.3 Regel 2/3) setzt korrekt
  `applicable: true` bei `confidence: "low"`. `effectiveApplicabilityForPrioritisation`
  blendet für die Priorisierung `needsLegalReview` aus (IN-02), wodurch
  `possibly_applicable` entsteht und die Vorbedingung von §9.3 erfüllt ist. In
  Kombination mit der überfälligen Frist wird daraus CRITICAL. Jeder Schritt
  ist für sich richtig; die Verkettung ist es nicht.
- **F:** Gibt es bereits Anbindung an EUR-Lex oder DIP?
  **A:** Nein. Beide sind als `SourceRecord.sourceSystem` modelliert, kein
  Codepfad ruft eine Quelle ab. Alle Daten stammen aus `src/data/seed.ts`.
- **F:** Ist eine Verbindung zum Code der Zielanwendung modelliert?
  **A:** Teilweise — `ComplianceControl.targetModule` trägt im Seed echte Pfade
  mit Export-Ankern (`src/ui/slots.tsx#AccessibilityStatementSlot`). Sie werden
  nie verifiziert.

### Blocker — Nutzerentscheidung nötig

- **F:** Wer ist der Zielnutzer — einzelnes Team, Agentur mit Portfolio, oder
  interne Compliance-Abteilung? Die Antwort entscheidet zwischen Massive #2
  (Repo-Analyzer, Team) und Massive #4 (Portfolio, Agentur). Beide zuerst geht
  nicht.
- **F:** Ist SPEC v2 §9.3 änderbar, oder ist der Spec-Text bindend? Die
  Priorisierungsreparatur (Do Now #1) berührt eine ausformulierte Spec-Regel.
  Falls bindend, ist der Ersatzweg eine zusätzliche Dringlichkeitsachse
  *neben* `priority`, ohne §9.3 anzutasten — schwächer, aber machbar.
- **F:** Soll das Modul über die drei Rechtsakte hinauswachsen (DSGVO, NIS2,
  CRA, GPSR)? `LegalActSlug` ist eine geschlossene Union mit expliziter
  Erweiterungskonvention — die Architektur ist vorbereitet, die
  Datenpflegekosten je Rechtsakt sind erheblich und entscheiden über die
  Portfolio-Ökonomie.
- **F:** Gibt es Budget für rechtliche Prüfung? Sechs Slots und neun
  `needsLegalReview`-Punkte sind ohne juristischen Input nicht auflösbar. Ohne
  diesen Kanal bleibt das System dauerhaft in „Vorbereitung" und erreicht nie
  einen freigegebenen Zustand — unabhängig von jedem Feature hier.

## Nächste Schritte

- [ ] **Entscheiden:** Zielnutzer (Team vs. Agentur) — blockiert die Reihenfolge
      der Massive-Wetten
- [ ] **Entscheiden:** Änderbarkeit von §9.3 — blockiert Do Now #1
- [ ] **Validieren:** Annahme „handgepflegtes Profil ist die Adoptionshürde" an
      2–3 echten Projekten gegenprüfen, bevor der Repo-Analyzer gebaut wird
- [ ] **Recherchieren:** EUR-Lex- und DIP-Schnittstellen — gibt es stabile
      APIs oder nur HTML? Entscheidet über Aufwand und Machbarkeit von Massive #1
- [x] **Gemessen:** Stichtag 2025-01-01 ergibt 0 × CRITICAL, 8 × HIGH,
      0 × MEDIUM, 12 × LOW. Die Priorisierung differenziert, aber rein nach
      Kalender und invertiert gegenüber der Vorlaufzeit (siehe Befund oben)
- [ ] **Entscheiden:** Soll Priorität die Vorlaufzeit einer Maßnahme
      einbeziehen (Kanzleifreigabe ≠ Konfigurationsänderung)? Das ist die
      inhaltliche Kernfrage hinter Do Now #1 und hinter Medium #9
- [ ] **Umsetzen:** Do-Now-Paket (Priorisierung + vier Report-Gems + Archivierung
      + `targetModule`-Prüfung)
