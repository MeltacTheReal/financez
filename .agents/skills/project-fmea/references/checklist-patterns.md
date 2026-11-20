# Tech-Stack-Agnostische Fehler-Checkliste

Prüfe bei der Analyse der Codebasis systematisch diese sechs Kategorien an allen Systemgrenzen und kritischen Pfaden:

## 1. Schnittstellen & Externe Abhängigkeiten
- [ ] **Fehlende Timeouts:** Netzwerk-Calls, DB-Abfragen oder IPC-Aufrufe ohne explizites Timeout (führt zu hängenden Threads/Workern).
- [ ] **Unkontrollierte Retries:** Wiederholungen ohne Exponential Backoff, Jitter oder Max-Retry-Limit (Gefahr von Retry-Storms / Self-DDoS).
- [ ] **Fehlende Idempotenz:** Mehrfaches Ausführen derselben Anfrage (z. B. durch Retry oder doppelten Webhook) erzeugt doppelte Datensätze oder Aktionen.
- [ ] **Vertragsbruch (Schema-Drift):** Externe Inputs oder API-Antworten werden ohne Laufzeit-Validierung direkt weiterverarbeitet.

## 2. Datenhaltung & Zustand (State)
- [ ] **Fehlende Atomarität / Transaktionen:** Mehrere zusammengehörige Schreibvorgänge laufen ohne Transaktion oder Rollback-Strategie (führt zu inkonsistentem Halbzustand bei Abbruch).
- [ ] **Race Conditions:** Parallele Lese-/Schreibzugriffe auf denselben Zustand ohne Locking, Versionierung (Optimistic Locking) oder Queueing.
- [ ] **Unbegrenzte Datenmengen:** Abfragen oder In-Memory-Puffer ohne Limit/Pagination (führt bei Wachstum zu Out-of-Memory).

## 3. Fehlerbehandlung & Observability
- [ ] **Silent Failures:** Exceptions/Errors werden abgefangen und ignoriert oder nur als generisches `true/false/null` zurückgegeben, ohne Kontext zu loggen.
- [ ] **Fehlende Fallback-Strategie:** Der Ausfall einer nicht-kritischen Nebenfunktion (z. B. Analytics, E-Mail-Versand) bringt den gesamten Hauptprozess zum Absturz.
- [ ] **Sensible Daten in Logs:** Tokens, Passwörter oder personenbezogene Daten landen unmasked in Error-Logs oder Stacktraces.

## 4. Nebenläufigkeit & Lebenszyklus
- [ ] **Ungeregelter Shutdown (Graceful Shutdown):** Laufende Requests oder Background-Jobs werden bei Deployment/Neustart hart abgebrochen, statt sauber beendet zu werden.
- [ ] **Ressourcen-Leaks:** Geöffnete Dateien, DB-Verbindungen, Streams oder Event-Listener werden im Fehlerpfad (`catch`/`finally`) nicht geschlossen.

## 5. Konfiguration & Deployment
- [ ] **Fail-Late bei Configs:** Fehlende oder ungültige Environment-Variablen fallen erst zur Laufzeit im kritischen Pfad auf statt direkt beim Start der Anwendung (Fail-Fast).
- [ ] **Hardcoded Limits / Secrets:** Feste URLs, Zertifikate, Tokens oder Kapazitätsgrenzen direkt im Code.

## 6. Sicherheit & Zugriffskontrolle
- [ ] **Fehlende Autorisierung auf Objektebene:** Authentifizierung ist vorhanden, aber es wird nicht geprüft, ob der User auf diese spezifische Ressourcen-ID zugreifen darf (IDOR).
- [ ] **Ungeprüfte Pfad- oder Befehlsübergaben:** User-Input fließt in Dateipfade, Queries oder Systembefehle ein.
