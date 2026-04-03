# Build stage
FROM node:20-alpine AS build-stage
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copiamos todo lo que NO está en .dockerignore (evitamos el .env local)
COPY . .

# Argumentos del build para inyectar la IP pública en el JS
ARG VITE_WS_URL
ARG VITE_WS_PROTOCOL
ARG VITE_WS_PORT
ARG VITE_CLIENT_PROTOCOL
ARG VITE_CLIENT_URL
ARG VITE_CLIENT_PORT
ARG VITE_BOTS
ARG VITE_MAX_NUMBER_BOTS

# Convertirlos en ENV para que Vite los vea al compilar
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_WS_PROTOCOL=$VITE_WS_PROTOCOL
ENV VITE_WS_PORT=$VITE_WS_PORT
ENV VITE_CLIENT_PROTOCOL=$VITE_CLIENT_PROTOCOL
ENV VITE_CLIENT_URL=$VITE_CLIENT_URL
ENV VITE_CLIENT_PORT=$VITE_CLIENT_PORT
ENV VITE_BOTS=$VITE_BOTS
ENV VITE_MAX_NUMBER_BOTS=$VITE_MAX_NUMBER_BOTS

RUN npm run build

# Production stage
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA (Single Page Application)
# Nota: \$uri escapa el signo $ para que Docker no lo reemplace
RUN printf "server { \n\
    listen 80; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
