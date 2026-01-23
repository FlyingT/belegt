# Build Stage
FROM node:18-alpine as build
WORKDIR /app

# Kopieren der Package-Dateien
COPY package.json ./

# Installieren der Abhängigkeiten (npm install statt ci, um Lockfile-Fehler zu vermeiden)
RUN npm install

# Kopieren des restlichen Quellcodes
COPY . .

# Build der App
RUN npm run build

# Production Stage
FROM nginx:alpine

# Kopieren der Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopieren der Build-Artefakte aus der Build-Stage
COPY --from=build /app/dist /usr/share/nginx/html

# Kopieren des Entrypoint-Scripts für Laufzeit-Umgebungsvariablen
COPY entrypoint.sh /docker-entrypoint.d/99-env-config.sh
RUN chmod +x /docker-entrypoint.d/99-env-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
