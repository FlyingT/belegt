# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
# Kopiere Build-Artefakte
COPY --from=build /app/dist /usr/share/nginx/html
# Kopiere Nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Kopiere Entrypoint Script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
