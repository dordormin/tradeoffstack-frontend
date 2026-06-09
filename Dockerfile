# ==========================================
# 1. BUILD STAGE
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

# Copier les configurations de dépendance
COPY package*.json ./

# Installer proprement les dépendances de production
RUN npm ci

# Copier tout le code source et lancer le build
COPY . .
RUN npm run build

# ==========================================
# 2. RUNTIME STAGE (Production)
# ==========================================
FROM nginx:alpine

# Copier le build statique de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Appliquer la configuration Nginx personnalisée pour le routage SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port d'écoute par défaut
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
