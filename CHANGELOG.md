# Changelog

Alle Änderungen an diesem Projekt werden in dieser Datei dokumentiert.


## [v1.8.0] - 2026-02-03
### Hinzugefügt
- **Catering / Arbeitsmittel**: Ressourcen können nun mit optionalen Catering-Optionen oder Arbeitsmitteln konfiguriert werden.
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
