FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json nest-cli.json ./ 
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

CMD ["node", "dist/main.js"]

