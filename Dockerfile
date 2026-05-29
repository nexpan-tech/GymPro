FROM node:20-alpine AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter backend exec prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter web build

EXPOSE 5050

CMD ["pnpm", "--filter", "backend", "start"]