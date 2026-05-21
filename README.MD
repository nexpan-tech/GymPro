# GymPro SaaS Platform

A modern multi-tenant Gym Management SaaS platform built using:

- Node.js
- TypeScript
- Express.js
- Prisma
- PostgreSQL
- Redis
- BullMQ
- React
- Expo React Native

---

# Project Goals

GymPro is designed to help gym businesses automate operations and reduce manual work.

Core goals:

- Gym management
- Trainer management
- Member management
- Automated collections
- Notifications
- Membership renewals
- Payment tracking
- Mobile-first member experience
- SaaS multi-tenant architecture

---

# Current Status

## Phase 1 — Core Platform

Completed.

Includes:

- Multi-tenant architecture
- JWT authentication
- Refresh tokens
- Role-based access
- Gym management
- Member management
- Trainer management
- Membership system
- Payment system
- Dues system
- Attendance foundation
- Audit logs
- Prisma ORM
- REST API architecture

---

## Phase 2 — Business Operations Automation

Completed.

Includes:

### Automation Engine

- Membership expiry reminders
- Pending dues reminders
- Renewal reminders
- Auto follow-ups
- Inactive member alerts

### Notification System

- Email notification infrastructure
- SMS notification infrastructure
- WhatsApp notification infrastructure
- Push notification infrastructure
- Queue workers
- Delivery tracking
- Device token system

### Collection Features

- Due collection dashboard
- Overdue reports
- Aging reports
- Payment reminders
- Renewal campaigns
- Partial payment tracking

---

# Folder Structure

```txt
gympro/
│
├── apps/
│   ├── backend/
│   ├── web/
│   └── mobile/
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# Backend Architecture

Backend uses:

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- JWT Authentication
- Queue Workers

---

# Backend Important Folders

```txt
apps/backend/src/
│
├── config/
├── middleware/
├── modules/
├── jobs/
├── queues/
├── services/
├── utils/
├── types/
└── server.ts
```

---

# Requirements

Install these first.

## Node.js

Recommended:

```txt
v20+
```

Check:

```bash
node -v
```

---

## pnpm

Install:

```bash
npm install -g pnpm
```

Check:

```bash
pnpm -v
```

---

## Redis

Required for:

- BullMQ
- Queue workers
- Notifications
- Background jobs

### Mac Install

```bash
brew install redis
```

Run:

```bash
brew services start redis
```

Check:

```bash
redis-cli ping
```

Expected:

```txt
PONG
```

---

# Project Installation

Clone project:

```bash
git clone YOUR_GITHUB_URL
```

Open:

```bash
cd gympro
```

Install dependencies:

```bash
pnpm install
```

---

# Backend Setup

Open backend:

```bash
cd apps/backend
```

Create environment file:

```bash
touch .env
```

---

# Backend `.env`

Paste this:

```env
NODE_ENV=development

PORT=5050

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

JWT_SECRET="super-secret-access-key"

JWT_REFRESH_SECRET="super-secret-refresh-key"

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="GymPro <your-email@gmail.com>"

WHATSAPP_ENABLED=false
WHATSAPP_API_URL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

SMS_ENABLED=false
SMS_PROVIDER=mock
SMS_API_KEY=
SMS_SENDER_ID=GYMPRO

PUSH_NOTIFICATIONS_ENABLED=false
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SENTRY_DSN=
```

---

# What Each `.env` Variable Means

## Database

```env
DATABASE_URL=
```

PostgreSQL database connection.

Can use:

- Neon
- Supabase
- Railway
- Local PostgreSQL

---

## JWT Secrets

```env
JWT_SECRET=
JWT_REFRESH_SECRET=
```

Used for authentication tokens.

Generate random long strings.

---

## Redis

```env
REDIS_HOST=
REDIS_PORT=
```

Used for:

- queues
- background jobs
- automation
- notifications

---

## SMTP

```env
SMTP_USER=
SMTP_PASS=
```

Used for email notifications.

Can use:

- Gmail App Password
- Resend
- SendGrid
- Mailgun

---

## WhatsApp

```env
WHATSAPP_ENABLED=
```

Future Meta WhatsApp Cloud API integration.

---

## SMS

```env
SMS_PROVIDER=
```

Future SMS provider integration.

Examples:

- Twilio
- MSG91
- TextLocal

---

## Push Notifications

```env
FIREBASE_PROJECT_ID=
```

Future Firebase Cloud Messaging integration.

---

# Database Setup

Push Prisma schema:

```bash
pnpm --filter backend exec prisma db push --schema=prisma/schema.prisma
```

Generate Prisma client:

```bash
pnpm --filter backend exec prisma generate --schema=prisma/schema.prisma
```

---

# Start Backend

From root:

```bash
pnpm --filter backend dev
```

Expected:

```txt
GymPro API running on port 5050
Automation schedulers initialized
```

---

# Backend URL

```txt
http://localhost:5050
```

---

# API Base URL

```txt
http://localhost:5050/api/v1
```

---

# Health Check

```bash
curl http://localhost:5050/health
```

---

# Web App Setup

Open root:

```bash
cd gympro
```

Run web app:

```bash
pnpm --filter web dev
```

Usually runs on:

```txt
http://localhost:5173
```

---

# Web `.env`

Create:

```txt
apps/web/.env
```

Add:

```env
VITE_API_URL=http://localhost:5050/api/v1
```

---

# Mobile App Setup

Open mobile app:

```bash
cd apps/mobile
```

Install:

```bash
pnpm install
```

---

# Mobile `.env`

Create:

```txt
apps/mobile/.env
```

Add:

```env
EXPO_PUBLIC_API_URL=http://localhost:5050/api/v1
```

---

# Run Mobile App

```bash
pnpm exec expo start -c --localhost --port 8081
```

For Android emulator:

```bash
adb reverse tcp:5050 tcp:5050
adb reverse tcp:8081 tcp:8081
```

---

# Authentication Test

Admin login:

```bash
curl -X POST http://localhost:5050/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@titan.com","password":"Admin@123"}'
```

---

# Save Token

```bash
ADMIN_TOKEN="YOUR_ACCESS_TOKEN"
```

---

# Test Notifications

```bash
curl http://localhost:5050/api/v1/notifications \
-H "Authorization: Bearer $ADMIN_TOKEN"
```

---

# Test Dues Dashboard

```bash
curl http://localhost:5050/api/v1/dues/dashboard \
-H "Authorization: Bearer $ADMIN_TOKEN"
```

---

# Test Device Token

```bash
curl -X POST http://localhost:5050/api/v1/devices/register \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "token": "test-device-token",
  "platform": "android"
}'
```

---

# Queue System

GymPro uses:

- Redis
- BullMQ

For:

- notifications
- automations
- reminders
- campaigns
- background processing

---

# Notification Channels

| Channel | Status |
|---|---|
| Email | Ready |
| SMS | Infrastructure Ready |
| WhatsApp | Infrastructure Ready |
| Push Notifications | Infrastructure Ready |

---

# Hosting Plan

## Backend

Recommended:

- Railway
- Render
- Fly.io
- AWS ECS
- DigitalOcean

---

## Database

Recommended:

- Neon
- Supabase
- AWS RDS

---

## Redis

Recommended:

- Upstash
- Redis Cloud

---

## Web

Recommended:

- Vercel
- Netlify

---

## Mobile

Recommended:

- Expo EAS Build

---

# Production Checklist

Before production:

- Set real JWT secrets
- Configure SMTP
- Configure Redis
- Configure PostgreSQL
- Configure Cloudinary
- Configure Sentry
- Configure SSL
- Configure backups
- Configure rate limiting
- Configure monitoring

---

# Git Workflow

Check changes:

```bash
git status
```

Add:

```bash
git add .
```

Commit:

```bash
git commit -m "Implement Phase 2 business operations automation"
```

Push:

```bash
git push origin main
```

---

# Release Tag

```bash
git tag -a v2.0.0 -m "Phase 2 complete"
git push origin v2.0.0
```

---

# Next Phase

## Phase 3 — Mobile Member Experience

Planned:

- Real push notifications
- Workout tracking
- Diet tracking
- QR attendance
- Transformation gallery
- Progress analytics
- Member engagement system
- Realtime features

---

# Important Notes

## Prisma After Schema Change

Always run:

```bash
pnpm --filter backend exec prisma db push --schema=prisma/schema.prisma
```

Then:

```bash
pnpm --filter backend exec prisma generate --schema=prisma/schema.prisma
```

---

# Restart TypeScript Server

If Prisma types fail:

```txt
Cmd + Shift + P
TypeScript: Restart TS Server
```

---

# Common Backend Run Command

```bash
pnpm --filter backend dev
```

---

# Common Problem

## Token expired

Fix:

Login again and get new access token.

---

# Author

GymPro SaaS Platform

Built for scalable modern gym business automation.