# Belegt? - Das Raum- & Ressourcenbuchungssystem

"Belegt?" ist ein Web-Tool für die einfache Verwaltung und Buchung von Firmenressourcen wie Konferenzräumen, Firmenfahrzeugen oder technischem Equipment, bereitstellbar via Docker. 
Vibe-Coded mit Gemini Antigravity und Google Deepmind (Advanced Agentic Coding).

Alles dabei:
- **Dashboard**: Übersicht aller Ressourcen und deren aktueller Status.
- **Buchungsoberfläche**: Einfaches Buchen von Ressourcen mit automatischer Zeitprüfung.
- **Kiosk-Modus**: Schlanke Ansicht für Displays vor Räumen mit dynamischem Countdown.
- **Admin-Dashboard**: Passwortgeschützte Verwaltung von Ressourcen (Räume, Fahrzeuge, Equipment).
- **Serverseitige Authentifizierung**: Sichere Session-basierte Anmeldung — Credentials werden nie an den Client gesendet.
- **Buchungsorganisation**: Kategorisierung von Buchungen (Heute, Anstehend, Vergangen) im Admin-Bereich.
- **Kiosk-Steuerung**: Gezielte Freigabe von Ressourcen für den Kiosk-Modus.
- **Erweiterte Buchungsdaten**: Erfassung der Abteilung bei Buchungen.
- **Daten-Export/Import**: Sicherung und Wiederherstellung von Buchungsdaten inklusive Abteilungsinfo.
- **Anpassbarkeit**: Systemname, Akzentfarbe und Kategorie-Icons direkt über die Oberfläche änderbar.
- **Ressourcen-Sortierung**: Individuelle Reihenfolge per Drag & Drop im Admin-Bereich.
- **Catering & Arbeitsmittel**: Optionale Zusatzleistungen (z.B. Kaffee, Technik) pro Ressource konfigurierbar.
- **Kostenstellen**: Optionales Pflichtfeld für Kostenstelle bei Catering-Buchungen.
- **Öffnungszeiten-Erweiterung**: Optionale Türöffnung außerhalb der regulären Zeiten anfragbar (mit separater E-Mail-Benachrichtigung).
- **Automatisierte E-Mail-Bestätigung**: Professionelle Email-Bestatigung nach erfolgreicher Buchung (SMTP Konfiguration im Admin-Bereich).
- **Dark Mode**: Automatische Anpassung an das System-Theme für Admin, Booking und Kiosk.
- **Sicherheit**: SMTP-Passwörter verschlüsselt gespeichert, Input-Validierung, Security-Header, Non-Root Docker Container.

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
Simple Anzeige unter eigenem Link für Kiosk-Anzeigen vor Räumen.

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

### Öffnungszeiten-Erweiterung
Spezielle Räume können für eine erweiterte Türöffnung markiert werden. Bei Buchung wird eine separate E-Mail an eine konfigurierbare Adresse (z.B. Pforte/Sicherheitsdienst) gesendet.

### Sicherheit
- Serverseitige Session-Authentifizierung (Flask-Sessions)
- Fernet-Verschlüsselung für SMTP-Passwörter
- Input-Validierung und E-Mail-Sanitization
- Nginx Security Headers (CSP, X-Frame-Options, etc.)
- Race-Condition-Schutz bei Buchungen (atomare Transaktionen)
- Non-Root Docker Container
- Gunicorn als Production WSGI Server

---

## Deployment (Docker Compose)

So bekommst du das System zum Laufen:

1. **.env Konfiguration:**
   Benenne die `sample.env` einfach in `.env` um und **ändere unbedingt das Admin-Passwort**:

```bash
cp sample.env .env
# Passwort in .env anpassen!
```

2. **Starten:**
   Einfach Docker Compose anschmeißen:

```bash
docker-compose up -d --build
```

> **Hinweis zur Sicherheit:** Standardmäßig bindet `docker-compose.yml` den Frontend-Port direkt auf den Host (Port 8080). Für den produktiven Einsatz empfiehlt es sich, einen Reverse Proxy wie [Nginx Proxy Manager](https://nginxproxymanager.com/) vorzuschalten und die `ports:`-Einträge in der `docker-compose.yml` durch `expose:` zu ersetzen und die direkte Port-Freigabe auszukommentieren. So kommunizieren die Container nur noch innerhalb des Docker-Netzwerks, und der Proxy übernimmt TLS-Terminierung und Zugangssteuerung.

> **Hinweis für Proxy-Konfiguration:** Der Frontend-Container lauscht intern auf Port **8080** (nicht 80), da er als Non-Root-User läuft. Bei Verwendung eines Reverse Proxy muss dieser auf Port `8080` des Frontend-Containers zeigen.

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
| `ADMIN_PASSWORD` | Passwort | — (muss gesetzt werden) |

### Optional (Backend)
| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `ALLOWED_ORIGINS` | Erlaubte CORS-Origins (kommagetrennt) | leer (nur Same-Origin) |
| `SECRET_KEY` | Flask Session Secret | automatisch generiert |

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Python Flask, Gunicorn, SQLAlchemy (SQLite)
- **Container:** Docker, Nginx Unprivileged (Alpine, Non-Root)
- **Sicherheit:** Fernet-Verschlüsselung, Session-Auth, CSP Headers, Pinned Dependencies

