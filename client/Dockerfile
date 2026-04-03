# Build stage
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_WS_URL
ARG VITE_BOTS
ARG VITE_MAX_NUMBER_BOTS
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_BOTS=$VITE_BOTS
ENV VITE_MAX_NUMBER_BOTS=$VITE_MAX_NUMBER_BOTS
RUN npm run build

# Production stage
FROM nginx:alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Default nginx config for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
