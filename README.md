# Belegt? - Ressourcen-Buchungssystem

"Belegt?" ist dein Tool für die einfache Verwaltung und Buchung von Firmenressourcen wie Konferenzräumen, Firmenfahrzeugen oder technischem Equipment.

Alles dabei: Buchungsoberfläche für alle, Admin-Dashboard für die Verwaltung und ein schicker Kiosk-Modus für Displays.

---

## 📸 Features

### Dashboard
Ohne Login erreichbare Übersicht aller Ressourcen.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S1-%C3%9Cbersicht.png)

### Buchen
Einfaches Formular mit direkter Verfügbarkeitsprüfung.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S2-Buchung1.png)

### Kalender Export
Nach der Buchung gibt's direkt den Kalendereintrag (.ics) zum Download für den eigenen Kalender.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S3-Buchung2.png)
![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S4-Buchung3.png)

### Admin-Bereich
Volle Kontrolle über Assets und Buchungen, Benutzername und Kennwort wird via environment variable gesetzt.

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S5-AdminLogin.png)

Ressourcen verwalten (anlegen, bearbeiten, löschen, sortieren)

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S6-AdminRessourcen1.png)

Icons und Farben anpassen

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S7-AdminRessourcen2.png)

Buchungen einsehen und stornieren

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S8-AdminBuchungen.png)

Texte und Labels konfigurieren

![](https://github.com/FlyingT/belegt/blob/main/Screenshots/S9-AdminEinstellungen.png)

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

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Python Flask, SQLAlchemy (SQLite)
- **Container:** Docker, Nginx (Alpine)
