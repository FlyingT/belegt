# Belegt? - Das Raum- & Ressourcenbuchungssystem

"Belegt?" ist ein Web-Tool für die einfache Verwaltung und Buchung von Firmenressourcen wie Konferenzräumen, Firmenfahrzeugen oder technischem Equipment, bereitstellbar via Docker. 
Vibe-Coded mit Gemini Antigravity und Google Deepmind (Advanced Agentic Coding).

Alles dabei:
- **Dashboard**: Übersicht aller Ressourcen und deren aktueller Status.
- **Buchungsoberfläche**: Einfaches Buchen von Ressourcen mit automatischer Zeitprüfung.
- **Kiosk-Modus**: Schlanke Ansicht für Displays vor Räumen mit dynamischem Countdown.
- **Admin-Dashboard**: Passwortgeschützte Verwaltung von Ressourcen (Räume, Fahrzeuge, Equipment).
- **Buchungsorganisation**: Kategorisierung von Buchungen (Heute, Anstehend, Vergangen) im Admin-Bereich.
- **Kiosk-Steuerung**: Gezielte Freigabe von Ressourcen für den Kiosk-Modus.
- **Erweiterte Buchungsdaten**: Erfassung der Abteilung bei Buchungen.
- **Daten-Export/Import**: Sicherung und Wiederherstellung von Buchungsdaten inklusive Abteilungsinfo.
- **Anpassbarkeit**: Systemname, Akzentfarbe und Kategorie-Icons direkt über die Oberfläche änderbar.
- **Ressourcen-Sortierung**: Individuelle Reihenfolge per Drag & Drop im Admin-Bereich.
- **Catering & Arbeitsmittel**: Optionale Zusatzleistungen (z.B. Kaffee, Technik) pro Ressource konfigurierbar.
- **Kostenstellen**: Optionales Pflichtfeld für Kostenstelle bei Catering-Buchungen.
- **Automatisierte E-Mail-Bestätigung**: Professionelle Email-Bestatigung nach erfolgreicher Buchung (SMTP Konfiguration im Admin-Bereich).
- **Dark Mode**: Automatische Anpassung an das System-Theme für Admin, Booking und Kiosk.

---

## Features

### Dashboard
Ohne Login erreichbare Übersicht aller Ressourcen.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S1-%C3%9Cbersicht.png)

### Buchen
Einfaches Formular mit direkter Verfügbarkeitsprüfung.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S2-Buchung1.png)

### E-Mail Bestätigung
Nach der Buchung wird automatisch eine Bestätigung an den Nutzer verschickt (konfigurierbar).

### Kiosk-Modus
Simple Anzeige unter eigenem Link für Kiosk-Anzeigen vor den Räumen.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S10-Kiosk1.png)
![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S11-Kiosk2.png)

### Admin-Bereich
Volle Kontrolle über Assets und Buchungen, Benutzername und Kennwort wird via environment variable gesetzt.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S5-AdminLogin.png)

Ressourcen verwalten (anlegen, bearbeiten, löschen, Drag & Drop Sortierung)

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S6-AdminRessourcen1.png)

Icons und Farben anpassen

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S7-AdminRessourcen2.png)

Buchungen verwalten (Tagesübersicht, Anstehend, Vergangen) und Exportieren/Importieren (.json)

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S8-AdminBuchungen.png)

Texte, Labels und Seitentitel (Browsertab) konfigurieren
    
![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S9-AdminEinstellungen.png)

### E-Mail & SMTP
Konfiguration der SMTP-Schnittstelle direkt im Admin-Panel inklusive Test-Versand.

---

## Deployment (Docker Compose)

So bekommst du das System zum Laufen:

1. **.env Konfiguration:**
   Benenne die `sample.env` einfach in `.env` um:

```bash
cp sample.env .env
```

2. **Starten:**
   Einfach Docker Compose anschmeißen:

```bash
docker-compose up -d --build
```

---

## Konfiguration

Nachfolgende Variablen werden über die `.env` gesteuert.

### Allgemein
| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `APP_PORT` | Port für das Frontend | `8080` |

### Admin Login
| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `ADMIN_USER` | Benutzername | `admin` |
| `ADMIN_PASSWORD` | Passwort | `belegt` |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Python Flask, SQLAlchemy (SQLite)
- **Container:** Docker, Nginx (Alpine)

---

**Release v1.11.1** - Cost Center Fixes & Docker Readiness 🚀
