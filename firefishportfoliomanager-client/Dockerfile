FROM node:lts-alpine as build

# Nastavení pracovního adresáře
WORKDIR /app

# Kopírování package.json a package-lock.json pro instalaci závislostí
COPY firefishportfoliomanager-client/package*.json ./

# Instalace závislostí
RUN npm install

# Kopírování zdrojových kódů
COPY firefishportfoliomanager-client/ ./

# Nastavení API URL pro produkční build
ENV REACT_APP_API_URL=http://localhost:7227

# Build aplikace
RUN npm run build

# Fáze pro produkční běh
FROM nginx:stable-alpine as production
WORKDIR /usr/share/nginx/html

# Kopírování buildnuté aplikace z předchozí fáze
COPY --from=build /app/build ./

# Kopírování vlastní nginx konfigurace
COPY firefishportfoliomanager-client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
