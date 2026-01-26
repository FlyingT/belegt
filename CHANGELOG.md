# Changelog

Alle Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [v1.2.0] - 2026-01-27

### Hinzugefügt
- Konfigurierbare Akzentfarbe hinzugefügt (Admin kann Farbe für Titel und Buttons festlegen)

### Geändert
- Buchungszeit wird jetzt auf die nächste volle Stunde vorausgewählt
- Reihenfolge im Buchungsformular optimiert (Titel -> Daten -> Zeit)

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
