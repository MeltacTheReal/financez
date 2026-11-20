---
name: project-fmea
description: Führt eine systematische Failure Mode and Effects Analysis (FMEA) über eine gesamte Codebasis, Systemarchitektur oder ein Repository durch. Nutzen, wenn Risiken, Single Points of Failure, Fehlerfortpflanzung, Resilienz oder kritische Pfade im Projekt analysiert werden sollen.
---

# Project-Level FMEA Workflow

Analysiere das Projekt **nicht** Datei für Datei, sondern risikobasiert entlang der Architektur, Systemgrenzen und kritischen Datenflüsse.

## Phase 1: Architektur-Mapping & Scoping (Top-Down)
1. **Struktur erfassen:** Verschaffe dir zuerst einen Überblick über Einstiegspunkte, Services, Datenbank-Layer, externe APIs, Message Queues und Hintergrundjobs (`package.json`, `docker-compose.yml`, Verzeichnisstruktur, Architektur-Dokus).
2. **Systemgrenzen & Komponenten definieren:** Zerlege das Projekt in logische Subsysteme (z. B. *Auth-Service*, *Payment-Worker*, *DB-Repository*, *External-API-Client*).
3. **Kritische Pfade priorisieren:** Identifiziere die 3–7 geschäfts- oder sicherheitskritischsten Flows (z. B. Datenverlust, Sicherheitslücken, Zahlungsabwicklung, Systemstillstand).

## Phase 2: Schnittstellen- & Abhängigkeits-Analyse (Bottom-Up Verifikation)
Untersuche gezielt die Übergänge zwischen den Subsystemen auf typische Fehlermuster (siehe `references/checklist-patterns.md`):
- **Externe Abhängigkeiten:** Timeouts, Retries, fehlende Circuit Breaker, ungültige Payloads.
- **Datenhaltung & State:** Race Conditions, fehlende Transaktionen, Schema-Mismatch, unvollständige Rollbacks.
- **Schnittstellen & Verträge:** Ungeprüfte Inputs, implizite Annahmen zwischen Modulen, Silent Failures (verschluckte Exceptions).
- **Konfiguration & Infrastruktur:** Fehlende Env-Variablen, ablaufende Zertifikate/Tokens, Ressourcen-Leaks.

Falls das Projekt erkennbar einen spezifischen Tech-Stack nutzt (z. B. Embedded C++, React/Node, Python, Kubernetes), ergänze die generische Checkliste automatisch um die 3–5 kritischsten laufzeitspezifischen Fehlermuster dieses Stacks.

## Phase 3: FMEA-Bewertung & Evidenzpflicht
Erstelle für jeden identifizierten Fehlermodus einen Eintrag nach den Kriterien in `references/scoring-rubric.md`:
- **Komponente / Schnittstelle:** Konkreter Bezug zu Modulen und Dateipfaden (`pfad/zur/datei.ts:Zeile`).
- **Potenzieller Fehlermodus (Failure Mode):** Was genau schlägt technisch fehl?
- **Fehlerfolge (Effect):** Lokale Auswirkung und Auswirkung auf das Gesamtsystem / den Endnutzer.
- **Fehlerursache (Cause):** Konkrete Code-Stelle, fehlende Absicherung oder Architektur-Lücke.
- **Aktuelle Maßnahmen (Controls):** Existierende Tests, Validierungen, Monitoring/Alerting.
- **Bewertung:** `S` (1–10), `O` (1–10), `D` (1–10) und daraus abgeleitet `AP` (Action Priority: High / Medium / Low).
- **Empfohlene Maßnahme:** Konkreter technischer Fix oder Architektur-Änderung.

## Leitplanken & Regeln
- **Keine Halluzinationen:** Jeder Fehlermodus muss durch konkrete Dateien, Funktionen oder Konfigurationsdateien belegt sein.
- **Skalierung bei großen Repos:** Bei sehr großen Monorepos zuerst nur die Kern-Domäne analysieren und am Ende vorschlagen, welche Sub-Module als Nächstes vertieft werden sollten.
- **Datei-Output (Pflicht):** Schreibe den fertigen FMEA-Report **nicht** als langen Text in den Chat, sondern speichere ihn direkt als Markdown-Datei im Repository unter `docs/fmea/FMEA-REPORT-YYYY-MM-DD.md` (erstelle den Ordner `docs/fmea/` falls nötig). Gib im Chat danach nur eine kurze Bestätigung mit dem Dateipfad und den Top-3-Risiken aus.
- **Report-Format:** Nutze für den Inhalt der Datei exakt die Struktur und Tabellen-Spalten aus `references/report-template.md`. Erstelle für jedes `HIGH`-Risiko zusätzlich einen Eintrag in Abschnitt 4 (Detail-Tickets).
