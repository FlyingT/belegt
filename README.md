# Belegt? - Ressourcen-Buchungssystem

"Belegt?" ist dein Tool für die einfache Verwaltung und Buchung von Firmenressourcen wie Konferenzräumen, Firmenfahrzeugen oder technischem Equipment.

Alles dabei: Buchungsoberfläche für alle, Admin-Dashboard für die Verwaltung und ein schicker Kiosk-Modus für Displays.

---

## 📸 Features

### Dashboard
Übersicht über alle Ressourcen. Sofort sehen, was frei ist.

### Buchen
Einfaches Formular mit direkter Verfügbarkeitsprüfung.

### Kalender Export
Nach der Buchung gibt's direkt den Kalendereintrag (.ics) zum Download für den eigenen Kalender.

### Admin-Bereich
Volle Kontrolle über Assets und Buchungen.

**Funktionen:**
- Ressourcen verwalten (anlegen, bearbeiten, löschen, sortieren)
- Icons und Farben anpassen
- Buchungen einsehen und stornieren
- Texte und Labels konfigurieren

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

Alles wird über die `.env` gesteuert.

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

## Troubleshooting

### Portainer: "http2: frame too large" oder "failed to list workers"
Dieser Fehler tritt auf, wenn Portainer Probleme mit Docker BuildKit hat.
**Lösung:** Setze die Umgebungsvariable `DOCKER_BUILDKIT=0` im Portainer Stack oder in deiner `.env` Datei, um das klassische Build-System zu erzwingen.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Python Flask, SQLAlchemy (SQLite)
- **Container:** Docker, Nginx (Alpine)