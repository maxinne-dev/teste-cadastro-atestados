# ====== Frontend (Vue + Vite) ======
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm ci
COPY . .
# default command is for dev; in prod use `npm run build` + nginx image
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
