# ====== Backend (NestJS) ======
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Install deps separately for better caching
COPY package*.json ./
RUN npm install
RUN npm ci

# Copy sources
COPY . .

# Build
RUN npm run build

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
