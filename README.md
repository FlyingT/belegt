# Belegt? - Ressourcen-Buchungssystem

"Belegt?" ist eine moderne, interne Webanwendung zur einfachen Verwaltung und Buchung von Firmenressourcen wie Konferenzräumen, Firmenfahrzeugen oder technischem Equipment.

Die Anwendung wurde entwickelt, um den Buchungsprozess zu rationalisieren und bietet spezielle Ansichten für Mitarbeiter, Administratoren und Info-Displays (Kiosk-Modus).

## Funktionen

### 🏢 Für Mitarbeiter
- **Übersicht:** Intuitive Darstellung aller verfügbaren Ressourcen, gruppiert nach Kategorien (Räume, Fahrzeuge, Equipment).
- **Status-Anzeige:** Sofortige Erkennung, ob eine Ressource verfügbar, belegt oder in Wartung ist.
- **Buchung:** Einfacher Buchungsprozess mit Kalenderauswahl und Zeiteingabe.
- **ICS-Export:** Herunterladen von Kalendereinträgen (.ics) nach erfolgreicher Buchung zur Integration in Outlook, Google Calendar oder Apple Calendar.

### 📺 Kiosk-Modus
- **Display-Ansicht:** Eine optimierte Vollbild-Ansicht für Tablets oder Bildschirme, die direkt vor Räumen oder bei Ressourcen angebracht sind.
- **Live-Status:** Zeigt großflächig an, ob die Ressource "FREI" oder "BELEGT" ist.
- **Automatische Aktualisierung:** Die Anzeige aktualisiert sich automatisch alle 60 Sekunden.

### ⚙️ Admin-Bereich
- **Ressourcen-Verwaltung:** Erstellen, Bearbeiten und Löschen von Assets.
- **Wartungsmodus:** Setzen von Ressourcen auf "In Wartung" (macht sie für Mitarbeiter unbuchbar).
- **Buchungsübersicht:** Liste aller Buchungen mit Löschfunktion.
- **Konfiguration:** Anpassung globaler Einstellungen (z.B. Systemname).

## Technologie-Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Routing:** React Router DOM
- **Deployment:** Docker, Nginx

*Hinweis: In dieser Version wird `localStorage` verwendet, um ein Backend zu simulieren. Die Daten bleiben im Browser des Nutzers oder im Kiosk-Browser persistent, solange der Cache nicht geleert wird.*

## Installation & Entwicklung

### Lokale Entwicklung

1. Repository klonen:
   ```bash
   git clone <repository-url>
   cd belegt
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```
   Die App ist nun unter `http://localhost:3000` erreichbar.

### Deployment mit Docker

Das Projekt enthält eine vollständige Docker-Konfiguration für den produktiven Einsatz mittels Nginx.

1. Container bauen und starten:
   ```bash
   docker-compose up --build -d
   ```

2. Zugriff:
   Die Anwendung ist unter `http://localhost:8080` erreichbar.

## Konfiguration

### Umgebungsvariablen (Docker)

Die Zugangsdaten für den Admin-Bereich können über die `docker-compose.yml` konfiguriert werden:

| Variable | Beschreibung | Standardwert |
|----------|--------------|--------------|
| `ADMIN_USER` | Benutzername für Admin-Login | `admin` |
| `ADMIN_PASSWORD` | Passwort für Admin-Login | `belegt` |

## Projektstruktur

- `/src/components`: Wiederverwendbare UI-Komponenten (Navbar, etc.)
- `/src/pages`: Hauptansichten (Dashboard, Buchung, Admin, Kiosk)
- `/src/services`: Logik für Datenhaltung (API-Simulation) und ICS-Generierung
- `/src/types`: TypeScript Interfaces
