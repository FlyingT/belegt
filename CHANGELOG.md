# Changelog
Alle Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [1.13.2] - 2026-02-26
### Sicherheit
- **Nginx**: Security-Headers (CSP, X-Frame-Options etc.) werden nun auch für statische Assets (JS, CSS, Bilder) gesendet (Nginx-Vererbungs-Bug behoben).
- **API**: E-Mail-Format-Validierung für Test-Mail-Empfänger hinzugefügt.
- **API**: `categoryIcons`-Konfiguration wird nun auf Struktur und Länge validiert.
- **API**: Buchungen können nur noch für existierende Ressourcen erstellt werden (404 bei ungültiger Asset-ID).
- **API**: `ProxyFix`-Middleware hinzugefügt, damit der Rate-Limiter hinter dem Reverse Proxy die echte Client-IP sieht.
- **Docker**: Frontend-Container läuft nun als Non-Root (`nginxinc/nginx-unprivileged`).
- **Dependencies**: Alle Frontend-Abhängigkeiten auf exakte Versionen gepinnt (`package.json` und `index.html` importmap).

## [1.13.1] - 2026-02-26
### Sicherheit
- **Auth**: Brute-Force-Schutz am Login-Endpunkt mit Rate-Limiting (max. 5 Versuche pro Minute pro IP via `flask-limiter`).
- **Auth**: Warnung im Container-Log beim Start, wenn das Standard-Admin-Passwort noch aktiv ist.
- **Auth**: Sicherheitswarnung als Banner im Admin-Dashboard bei aktivem Standard-Passwort.
- **Validierung**: Input-Validierung in `update_asset` auf Parität mit `create_asset` gebracht (Längen, Farbformat).
- **Validierung**: Catering-JSON-Struktur wird bei Buchungserstellung geprüft (nur String-Schlüssel und numerische Werte).

### Geändert
- **README**: Sicherheitshinweis zu Reverse-Proxy-Konfiguration und Port-Freigabe im Deployment-Abschnitt ergänzt.

## [1.13.0] - 2026-02-21
### Sicherheit
- **Auth**: Serverseitige Authentifizierung mit Flask-Sessions (Login, Logout, Session-Check).
- **Auth**: `admin_required`-Decorator schützt alle Admin-API-Endpunkte (Assets, Buchungen, Konfiguration).
- **Auth**: Admin-Credentials werden nicht mehr an den Client ausgeliefert (`env-config.js` bereinigt, Script-Tag entfernt).
- **SMTP**: Passwort wird mit Fernet-Verschlüsselung in der Datenbank gespeichert (automatische Migration bestehender Klartext-Passwörter).
- **SMTP**: `GET /api/config` gibt SMTP-Passwort nur noch maskiert (`********`) zurück.
- **CORS**: Zugriff auf konfigurierbare Origins beschränkt (`ALLOWED_ORIGINS` Env-Var, Standard: keine Cross-Origin-Requests).
- **Race Condition**: Buchungserstellung nutzt SQLite `BEGIN EXCLUSIVE` Transaction (Overlap-Check + Insert atomar).
- **Input-Validierung**: Pflichtfelder, E-Mail-Format, Feldlängen und Farbformat werden serverseitig geprüft (Assets, Buchungen, Konfiguration).
- **E-Mail Header Injection**: Newline-Zeichen werden aus allen E-Mail-Feldern entfernt.
- **Nginx**: Security-Header hinzugefügt (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection).
- **Docker**: Backend läuft als Non-Root User (`appuser`).
- **Produktion**: Gunicorn als WSGI-Server statt Flask Development Server.
- **Logging**: `print()` durch Python `logging`-Modul ersetzt.

## [1.12.0] - 2026-02-17
### Hinzugefügt
- **Admin**: Türöffnungs-Option pro Ressource.
- **Admin**: Türöffnungs-Option in der Buchungsübersicht (`/info`).
- **Booking Flow**: Türöffnungs-Option im Buchungsformular. 

### Behoben
- **Admin**: Sticky Save-Button auf der rechten Seite der Einstellungen.
- **Admin**: Pfeile vom SMTP Port Eingabefeld entfernt.
- **Admin**: Test-Mail Sektion wieder in die E-Mail Benachrichtigungen Box verschoben.
- **Admin**: Bezeichnung "Mail an" in "Anfrage an" korrigiert.
- **Admin**: Alle Speichern-Buttons auf "Speichern & Neuladen" vereinheitlicht.
- **Booking Flow**: Ausrichtung der Checkboxen für Catering und Türöffnung vereinheitlicht.

## [1.11.1] - 2026-02-17
### Hinzugefügt
- **Info**: Die Buchungsübersicht (`/info`) aktualisiert sich nun alle 60 Sekunden automatisch.

### Behoben
- **E-Mail**: Kostenstelle wird nun in der Buchungsbestätigung an den Nutzer aufgeführt.
- **Admin/Info**: Sichtbarkeit der Kostenstelle in der Buchungsübersicht (`/info`).
- **UI**: Countdown-Timer für den Auto-Refresh auf der Buchungsübersicht (`/info`) hinzugefügt.
- **UI**: Icon und "Zurück zur Buchung" Button von der Buchungsübersicht (`/info`) entfernt.
- **UI**: Abstand zwischen "Catering / Arbeitsmittel?" Label und der Auswahlbox im Buchungsformular vergrößert.


## [1.11.0] - 2026-02-17
### Hinzugefügt
- **Admin**: Option "Kostenstelle nötig?" pro Ressource (für Catering/Equipment).
- **Booking Flow**: Abfrage der Kostenstelle, falls für die Ressource aktiviert und Catering ausgewählt wurde.
- **Listen**: Anzeige der Kostenstelle in Admin-Buchungslisten und der öffentlichen Übersicht (`/info`).

## [1.10.2] - 2026-02-03
### Geändert
- **E-Mail-Bestätigung**: Betreff enthält nun Ressource und Zeitraum.
- **E-Mail-Bestätigung**: Catering-Header auf "Zugebuchtes Catering / Arbeitsmittel" aktualisiert.
- **Admin**: E-Mail-Einstellungen direkt hinter "Allgemein" verschoben.
- **Admin**: Struktur- und Einrückungsfehler in den Einstellungen behoben.
- **Frontend**: Bestätigungstext nach Buchung vereinfacht.

## [1.10.1] - 2026-02-03
### Behoben
- **Build-Fix**: Fehlender React-Import in `Confirmation.tsx` hinzugefügt.

## [1.10.0] - 2026-02-03
### Hinzugefügt
- **Automatisierte E-Mail-Bestätigung**: System verschickt nun automatisch Bestätigungs-Mails nach erfolgreicher Buchung.
- **Admin**: Neuer Bereich "E-Mail Benachrichtigungen" in den Einstellungen zur Konfiguration der SMTP-Schnittstelle.
- **Admin**: "Test-Mail senden" Funktionalität zur sofortigen Überprüfung der SMTP-Konfiguration.
- **Buchung**: Dynamische Bestätigungsseite zeigt nun an, wenn eine Bestätigung per Mail verschickt wurde.

### Geändert
- **Confirmation Page**: Der manuelle .ics-Download Button wird nur noch angezeigt, wenn der E-Mail-Versand deaktiviert ist.


## [1.9.1] - 2026-02-03
### Behoben
- **Build-Fix**: TypeScript-Fehler und API-Methodennamen korrigiert, die den GitHub Actions Build blockiert haben.
- **Typisierung**: Explizite Typen in `Admin.tsx` und `PublicOverview.tsx` hinzugefügt.

## [1.9.0] - 2026-02-03
### Hinzugefügt
- **Öffentliche Übersicht (`/info`)**: Eine passwortfreie, schreibgeschützte Übersicht aller Buchungen (Heute, Anstehend, Vergangen), erreichbar über einen neuen Button im Admin-Bereich oder direkt via `/info`.

### Behoben
- Admin: Kaffeetassen-Icon in der Catering-Spalte entfernt für einen cleanereren Look.
- Admin: Zeitspalte (Zeitraum) zur Tabelle der vergangenen Buchungen hinzugefügt, um Konsistenz mit anderen Tabellen zu gewährleisten.

## [1.8.1] - 2026-02-01
### Geändert
- **Admin**: Beschriftung "Weiteres Feld hinzufügen" in Kleinschreibung geändert.
- **Admin**: Tabellenüberschrift "Nutzung" in der Ressourcen-Liste zu "Gesamtnutzung" umbenannt.
- **Admin**: Dedizierte Spalte "Catering" in den Buchungsübersichten hinzugefügt.
- **Booking Flow**: Checkbox für Catering zur besseren Lesbarkeit hinter den Text verschoben.
- **Booking Flow**: Hinweistext zur Catering-Auswahl entfernt.
- **Booking Flow**: Up/Down Arrows (Spin-Buttons) bei den Mengenangaben für Catering entfernt.

## [v1.8.0] - 2026-02-03
### Hinzugefügt
- **Catering & Arbeitsmittel**: Optionale Zusatzleistungen pro Buchung mit Inventarverwaltung.
- **E-Mail-Benachrichtigungen**: Automatische Bestätigungen für Nutzer.
- **Admin**: Neues Interface zum Definieren von Catering-Optionen pro Ressource.
- **Booking Flow**: Nutzer können beim Buchen Catering-Optionen mit Mengenangaben (+/- Buttons) auswählen.
- **Admin**: Anzeige der gebuchten Catering-Optionen (nur Mengen > 0) in der Tagesübersicht und den anstehenden Buchungen.

## [v1.7.3] - 2026-02-03
### Behoben
- **Admin**: Kontrast der Zeitraum-Anzeige bei anstehenden Buchungen sowie die Überschrift "Konfiguration" im Dark Mode verbessert.
- **Admin**: Beschriftung der Spalten in der Buchungsübersicht von "Asset" zu "Ressource" geändert.
- **Admin**: Schreibweise von "Anstehend (ab Morgen)" korrigiert.

## [v1.7.2] - 2026-02-03
### Behoben
- **Booking Flow**: Rote Markierung (*) bei dem Feld \"Abteilung\" entfernt (optionales Feld).
- **Booking Flow**: Kontrast der Zeitangaben bei vorhandenen Buchungen im Dark Mode verbessert.
- **Admin**: Styling-Fehler bei aktiven Terminen im Dark Mode behoben (bessere Lesbarkeit und Hintergrundfarbe).

## [v1.7.1] - 2026-02-03
### Behoben
- **Admin**: Reihenfolge der Platzhalter für E-Mail und Abteilung korrigiert.
- **Booking Flow**: Dark Mode Styling für das Buchungsformular vervollständigt.

## [v1.7.0] - 2026-02-03
### Hinzugefügt
- **Dark Mode**: Vollständiger Dark Mode Support für die gesamte Applikation.
- **Admin**: Styling-Anpassungen (Schatten, Farben) für eine bessere Konsistenz.

## [v1.6.0] - 2026-02-03
### Hinzugefügt
- **Kiosk Toggle pro Asset**: Assets können nun explizit für den Kiosk-Modus aktiviert/deaktiviert werden.
- **Abteilung als Feld**: Buchungen enthalten nun ein optionales Feld für die Abteilung.
- **Import Erweiterung**: Import von Buchungen unterstützt nun das Abteilungsfeld.
- **Admin UI Updates**: Anzeige der Kiosk-Option in der Asset-Verwaltung und Abteilung in der Buchungsliste.

## [v1.5.1] - 2026-02-0326

### Geändert
- **Favicon**: Browser-Icon (Kalender) hinzugefügt.
- **Admin**: "Speichern"-Buttons in den Einstellungen zu "Speichern & Neuladen" umbenannt und in die jeweiligen Boxen (unten rechts) verschoben.
- **Admin**: Akzentfarben-Vorschau in den Einstellungen verbreitert.

## [v1.5.0] - 2026-01-26

### Hinzugefügt
- **Admin**: "Buchungen" Tab strukturiert in "Tagesübersicht" (mit Statusfarben), "Anstehend" und "Vergangen".

## [v1.4.0] - 2026-01-26

### Hinzugefügt
- **Admin**: Export (Download als JSON) und Import (Upload JSON) von Buchungen im Tab "Buchungen".

## [v1.3.0] - 2026-01-26

### Hinzugefügt
- **Admin**: Neue Spalte "Nutzung" in der Ressourcen-Tabelle zeigt die Gesamtanzahl der Buchungen pro Asset an.

## [v1.2.3] - 2026-01-26

### Geändert
- **Buchung**: Hinweistext im Buchungsformular nach links verschoben.
- **Kiosk**: Countdown für Datenaktualisierung ist nun dynamisch sichtbar.

## [v1.2.2] - 2026-01-26

### Geändert
- **App**: Versionsnummer im Footer ist nun anklickbar und verlinkt auf das Changelog.
- **Buchung**: Hinweistext zum Datenschutz (Sichtbarkeit der Daten) neben dem "Jetzt Buchen"-Button hinzugefügt.

## [v1.2.1] - 2026-01-26

### Geändert
- Admin-Einstellungen: Seite wird nach dem Speichern automatisch neu geladen

## [v1.2.0] - 2026-01-26

### Geändert
- Admin-Einstellungen: Speichern-Button in allen Sektionen hinzugefügt

## [v1.1.0] - 2026-01-26

### Hinzugefügt
- **Admin**: Konfiguration für "Seitentitel" (Browser Tab) hinzugefügt.
- **Backend**: Datenbank-Migration für `site_title` in `AppConfig`.

### Geändert
- **Admin**: Spalte "Sort" in der Ressourcen-Tabelle zu "Sortierung" umbenannt.
- **Buchung**: Automatische Anpassung der Endzeit (+1 Stunde), wenn die Startzeit im Buchungsformular geändert wird.
- **Allgemein**: Versionsnummer im Footer auf v1.1.0 erhöht.

## [v1.0.0] - 2026-01-23

### Hinzugefügt
- Initialer Release.
- Dashboard zur Übersicht.
- Buchungsfunktion.
- Admin-Bereich zur Verwaltung von Ressourcen und Buchungen.
- Kiosk-Modus.
