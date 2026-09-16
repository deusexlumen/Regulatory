# Generierte Reports (§15)

Die Dateien in diesem Verzeichnis werden mit `npm run reports` erzeugt und sind
hier eingecheckt, damit die Ausgabe des Moduls ohne Ausführung nachvollziehbar
ist.

Sie wurden mit einem **festen Stichtag** erzeugt, damit sie reproduzierbar
bleiben und nicht bei jedem Lauf durch verschobene Fristen churnen:

```bash
npm run reports -- --date 2026-09-16
```

Ohne `--date` rechnet das Modul gegen das aktuelle Datum in der Zeitzone
`Europe/Berlin` (§9.5.2).

| Datei | Spec |
|---|---|
| `roadmap.md` | §15.1 Markdown Roadmap |
| `regulatory-data.json` | §15.2 JSON Regulatory Data |
| `checklists.md` | §15.3 Checklists |
| `open-questions.md` | §15.4 Open Questions Report |

Dateien mit dem Suffix `.profile-brochure-site` gehören zum zweiten
Projektprofil (Informationswebsite ohne Transaktion), an dem die
Prüfgegenstand- und Nichtanwendbarkeitsregeln aus §8.3 sichtbar werden.
