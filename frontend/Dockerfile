# ====== Frontend (Vue + Vite) ======
# Dev stage (optional) runs Vite server
FROM node:20-alpine AS dev
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm ci --omit=optional
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# RUN npm ci --omit=optional
COPY . .
RUN npm run build

# Production stage: serve static files via nginx and proxy /api to backend
FROM nginx:1.27-alpine AS prod
RUN apk update && \
    apk add nodejs npm
WORKDIR /usr/share/nginx/html
COPY --from=build /usr/src/app/dist ./
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
