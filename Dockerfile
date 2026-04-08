FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*

FROM base AS dev
COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

FROM base AS build
COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS prod
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
CMD ["npm", "run", "start:prod"]
