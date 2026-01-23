FROM python:3.10-slim

WORKDIR /app

# System-Abhängigkeiten
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python Abhängigkeiten
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App Code
COPY . .

# Port freigeben
EXPOSE 5000

# Startbefehl
CMD ["python", "app.py"]
