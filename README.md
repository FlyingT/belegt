# Belegt? - Ressourcen-Buchungssystem

"Belegt?" ist eine moderne, interne Webanwendung zur einfachen Verwaltung und Buchung von Firmenressourcen wie Konferenzräumen, Firmenfahrzeugen oder technischem Equipment.

Die Anwendung wurde entwickelt, um den Buchungsprozess zu rationalisieren und bietet spezielle Ansichten für Mitarbeiter, Administratoren und Info-Displays (Kiosk-Modus).

## Funktionen

### 🏢 Für Mitarbeiter
- **Übersicht:** Intuitive Darstellung aller verfügbaren Ressourcen, gruppiert nach Kategorien.
- **Visualisierung:** Anpassbare Icons für Kategorien und einzelne Ressourcen für schnellere Erkennbarkeit.
- **Status-Anzeige:** Sofortige Erkennung, ob eine Ressource verfügbar, belegt oder in Wartung ist.
- **Buchung:** 
  - Kalenderauswahl und Zeiteingabe.
  - Angabe eines Buchungsgrundes (Titel).
  - Anzeige bestehender Buchungen am ausgewählten Tag zur Vermeidung von Konflikten.
  - **Benutzerfreundliche Formulare:** Durch den Admin konfigurierbare Platzhaltertexte erleichtern die Eingabe.
- **ICS-Export:** Herunterladen von Kalendereinträgen (.ics) nach erfolgreicher Buchung zur Integration in Outlook, Google Calendar oder Apple Calendar.

### 📺 Kiosk-Modus
- **Display-Ansicht:** Eine optimierte Vollbild-Ansicht für Tablets oder Bildschirme, die direkt vor Räumen oder bei Ressourcen angebracht sind.
- **Live-Status:** Zeigt großflächig an, ob die Ressource "FREI" oder "BELEGT" ist.
- **Tagesplan:** Listet alle heutigen Buchungen (Zeitraum, Titel, Nutzer) auf.
- **Automatische Aktualisierung:** Die Anzeige aktualisiert sich automatisch alle 60 Sekunden.

### ⚙️ Admin-Bereich
- **Ressourcen-Verwaltung:** 
  - Erstellen, Bearbeiten und Löschen von Assets.
  - **Sortierung:** Einfaches Ändern der Reihenfolge der Ressourcen per Pfeiltasten.
  - **Individualisierung:** Auswahl spezifischer Icons pro Ressource (via Icon-Picker) und zufällige Farbgenerierung für die UI.
- **Wartungsmodus:** Setzen von Ressourcen auf "In Wartung" (macht sie für Mitarbeiter unbuchbar).
- **Buchungsübersicht:** Liste aller Buchungen mit Löschfunktion.
- **Konfiguration:** 
  - Anpassung des Systemnamens (Header-Text).
  - **Kategorie-Icons:** Visuelle Zuweisung von Standard-Icons für Ressourcen-Kategorien über ein Raster.
  - **Formular-Platzhalter:** Anpassung der Beispieltexte (Placeholder) für Titel, Name und E-Mail im Buchungsformular.

## Technologie-Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Routing:** React Router DOM (Browser Router)
- **Deployment:** Docker, Nginx
- **Backend:** Python Flask, SQLAlchemy (SQLite)

## Installation & Entwicklung

### Lokale Entwicklung

1. Repository klonen:
   ```bash
   git clone https://github.com/FlyingT/belegt.git
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

### Deployment mit Docker (Direkt aus Git)

Du kannst die Anwendung direkt aus dem Git-Repository starten, ohne es vorher zu klonen. Erstelle dazu einfach eine `docker-compose.yml` mit folgendem Inhalt:

```yaml
version: '3.8'

services:
  # Backend (Python Flask API)
  backend:
    build:
      context: https://github.com/FlyingT/belegt.git#main:backend
      dockerfile: Dockerfile
    container_name: belegt-backend
    expose:
      - "5000"
    volumes:
      - backend_data:/app/instance
    restart: unless-stopped
    networks:
      - belegt-network

  # Frontend (React + Nginx)
  app:
    build:
      context: https://github.com/FlyingT/belegt.git#main
      dockerfile: Dockerfile
    container_name: belegt-frontend
    ports:
      - "${HOST_PORT:-8080}:80"
    environment:
      - ADMIN_USER=${ADMIN_USER:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-belegt}
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - belegt-network

volumes:
  backend_data:

networks:
  belegt-network:
    driver: bridge
```

Starte den Stack anschließend mit:

```bash
docker-compose up -d --build
```

Die Anwendung ist dann unter `http://localhost:8080` (oder dem in `HOST_PORT` definierten Port) erreichbar.

## Konfiguration

### Umgebungsvariablen

Die Zugangsdaten für den Admin-Bereich können in der `docker-compose.yml` oder über eine `.env` Datei konfiguriert werden:

| Variable | Beschreibung | Standardwert |
|----------|--------------|--------------|
| `ADMIN_USER` | Benutzername für Admin-Login | `admin` |
| `ADMIN_PASSWORD` | Passwort für Admin-Login | `belegt` |
| `HOST_PORT` | Port, auf dem das Frontend erreichbar ist | `8080` |

## Projektstruktur

- `/src/components`: Wiederverwendbare UI-Komponenten (Navbar, etc.)
- `/src/pages`: Hauptansichten (Dashboard, Buchung, Admin, Kiosk)
- `/src/services`: Logik für Datenhaltung (API-Anbindung) und ICS-Generierung
- `/src/utils`: Hilfsfunktionen (z.B. Icon-Mapping)
- `/src/types`: TypeScript Interfaces
- `/backend`: Python Flask Server Code