FROM node:22-alpine AS base

RUN corepack enable
RUN corepack prepare pnpm@10.21.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter backend exec prisma generate --schema=prisma/schema.prisma

EXPOSE 5050

CMD ["pnpm", "--filter", "backend", "start"]