# FMEA Bewertungsmatrix (Software & Systeme)

Bewerte jeden Fehlermodus anhand von **Severity (S)**, **Occurrence (O)** und **Detection (D)** auf einer Skala von 1 bis 10. Leite daraus die **Action Priority (AP)** ab.

## 1. Severity (S) – Auswirkung des Fehlers

| Wert | Stufe | Kriterium in Software-Systemen |
| :--- | :--- | :--- |
| **9–10** | Kritisch | Unwiederbringlicher Datenverlust, Datenkorruption, Sicherheitslücke (Auth/Leak), kompletter Systemausfall oder rechtlicher/finanzieller Schaden. |
| **7–8** | Hoch | Kernfunktion komplett ausgefallen, kein Workaround möglich, manuelles Eingreifen durch Ops/Devs zwingend nötig. |
| **4–6** | Mittel | Teilfunktion gestört, System läuft degradiert weiter oder fängt sich erst nach Neustart/Retry. |
| **1–3** | Niedrig | Kosmetischer Fehler, verzögerte Hintergrundverarbeitung ohne Datenverlust, automatische Selbstheilung. |

## 2. Occurrence (O) – Eintrittswahrscheinlichkeit

| Wert | Stufe | Kriterium im Betrieb |
| :--- | :--- | :--- |
| **8–10** | Sehr hoch | Tritt bei normalem Betrieb, Standard-Last oder üblichen Netzwerkschwankungen fast sicher auf (z. B. fehlender Timeout, ungültiger User-Input). |
| **5–7** | Mittel | Tritt regelmäßig bei Edge-Cases, Lastspitzen, parallelen Zugriffen oder Neustarts auf. |
| **3–4** | Gering | Tritt nur unter ungewöhnlichen Bedingungen oder bei Ausfall einer externen Drittanbieter-Komponente auf. |
| **1–2** | Sehr gering | Extrem unwahrscheinlich; erfordert gleichzeitiges Versagen mehrerer unabhängiger Schutzmechanismen. |

## 3. Detection (D) – Entdeckbarkeit (vor Auswirkung auf Nutzer/Daten)

| Wert | Stufe | Kriterium für Tests, Monitoring & Error-Handling |
| :--- | :--- | :--- |
| **9–10** | Keine / Silent | **Silent Failure:** Fehler wird verschluckt (leerer Catch-Block), kein Log, kein Alert, kein Test – fällt erst Wochen später durch inkonsistente Daten auf. |
| **7–8** | Sehr gering | Keine automatisierten Tests oder Alerts; wird erst durch Support-Tickets von Endnutzern bemerkt. |
| **4–6** | Mittel | Wird in Logs geschrieben oder durch manuelle Prüfung/Monitoring-Dashboards sichtbar, aber ohne aktives Alerting oder automatischen Abbruch. |
| **1–3** | Hoch | Wird zuverlässig durch Integrationstests, Typen/Schema-Checks, Circuit Breaker oder sofortige Alerts abgefangen. |

## 4. Action Priority (AP) Ableitung
* **HIGH:** `S >= 9` (unabhängig von O/D) **ODER** (`S >= 7` und `O >= 5`) **ODER** (`S >= 7` und `D >= 7`).
* **MEDIUM:** `S` zwischen 5–8 mit moderatem `O` oder `D`, sowie `S <= 4` bei gleichzeitig hohem `O >= 7` und `D >= 7`.
* **LOW:** Alle übrigen Kombinationen mit geringer Auswirkung und guter Entdeckbarkeit.
