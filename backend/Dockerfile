# Basis-Image
FROM python:3.9-slim

WORKDIR /app

# Abhängigkeiten installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App-Code kopieren
COPY . .

# Instance-Ordner für die SQLite Datenbank erstellen
RUN mkdir -p instance

# Port freigeben
EXPOSE 5000

# Start-Befehl
CMD ["python", "app.py"]
