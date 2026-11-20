# FMEA Output-Template

Halte dich bei der Ausgabe exakt an diese Struktur. Verzichte auf einleitende Floskeln und beginne direkt mit dem Report.

---

# Project FMEA Report: [Projektname]

- **Analysierter Scope:** [z. B. Gesamtes Repo / Fokus auf Checkout & Auth]
- **Identifizierte Subsysteme:** [Liste der erkannten Hauptkomponenten]
- **Risiko-Übersicht:** `[X] HIGH` | `[Y] MEDIUM` | `[Z] LOW`

## 1. Executive Summary (Top-Risiken)
- **Kritischster Single Point of Failure:** [1–2 Sätze inkl. Datei-Referenz]
- **Größte blinde Flecken (Detection):** [Wo passieren aktuell Silent Failures?]
- **Sofortmaßnahme (Quick Win):** [Welcher Fix reduziert das Gesamtrisiko am schnellsten?]

## 2. Systemkarte & Kritische Pfade
*Kurze Übersicht der analysierten Komponenten und ihrer Schnittstellen:*
- **[Komponente A] → [Komponente B]:** [Art der Verbindung, z. B. HTTP/REST, DB-Query, Event-Queue]
- ...

## 3. FMEA-Tabelle (sortiert nach Action Priority)

| ID | AP | Komponente / Pfad | Fehlermodus (Failure Mode) | Fehlerfolge (Effect) | Fehlerursache (Cause) | Aktuelle Controls | S | O | D | Empfohlene Maßnahme |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: | :-: | :-: | :--- |
| **FMEA-01** | **HIGH** | `src/api/webhook.ts:42` | Doppelte Verarbeitung bei Retry | Doppelte Abbuchung / inkonsistenter Status | Kein Idempotency-Key geprüft | Keine | 9 | 7 | 8 | Idempotency-Key in DB vor Verarbeitung speichern |
| **FMEA-02** | **HIGH** | `src/db/client.ts:18` | Hängende Verbindung bei DB-Last | Kompletter API-Stillstand (Thread-Exhaustion) | Kein Query- oder Connection-Timeout gesetzt | Default-Pool | 8 | 6 | 7 | `statement_timeout` und Pool-Timeout auf 5s setzen |

## 4. Detail-Tickets für `HIGH`-Risiken
*Erstelle für jeden `HIGH`-Eintrag einen direkt umsetzbaren Mini-Task:*

### [FMEA-01] [Kurztitel des Risikos]
- **Betroffene Stellen:** `pfad/zur/datei:Zeile`
- **Szenario:** [Wie genau tritt der Fehler Schritt für Schritt auf?]
- **Konkreter Fix:** [Technische Beschreibung oder kurzer Code-Ansatz zur Behebung]
- **Verifikation:** [Wie lässt sich der Fix per Test prüfen?]

## 5. Nächste empfohlene Analyse-Schritte
- [Welche Module/Flows wurden aus Scope-Gründen noch nicht tief geprüft und sollten als Nächstes folgen?]
