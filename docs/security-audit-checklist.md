# GymPro — Security Audit / Pen-Test Checklist (Stage 10)

Status legend: ✅ implemented · ⚠️ partial / documented gap · ☐ to verify in pen test.

## Authentication & sessions
- ✅ JWT access tokens (`socket-auth` + `auth.middleware`), short-lived; refresh tokens stored client-side.
- ✅ Brute-force protection on `/auth/login` (`bruteForceProtection` + `authLimiter` 20/15m).
- ✅ Device sessions: register / markSeen / **revoke** (`device-sessions` module) — supports remote logout.
- ⚠️ **Refresh-token rotation NOT enabled** on `/auth/refresh` (the same refresh token is reused). Documented gap — rotating it requires coordinated mobile/web changes (avoid invalidating live sessions mid-flight). Recommended next: rotate + reuse-detection (revoke family on reuse).
- ☐ Verify JWT expiry is enforced and tampered/None-alg tokens are rejected (`verifySocketToken` uses `jwt.verify`).

## Authorization (RBAC + tenant isolation)
- ✅ `roleMiddleware` on all sensitive routes; member self-routes scoped by `userId`.
- ✅ Tenant isolation: every query scoped by `gymId`; cross-gym access returns 403/404 (covered by E2E tenant-isolation tests across Stages 6–9).
- ☐ **Auth-bypass / IDOR**: attempt to read another gym's members/payments/announcements/chat by guessing IDs — must 403/404. (Cross-trainer chat 403 + cross-gym leaderboard 404 already E2E-verified.)
- ☐ **Tenant escape via feature-flag / white-label**: a gym-admin must not toggle another gym's flags (super-admin only) or read another gym's settings.

## WebSocket
- ✅ JWT-authenticated handshake; unauthorized connections rejected; user/gym/role rooms.
- ✅ Redis-adapter init wrapped in try/catch → in-memory fallback (no boot crash if Redis down).
- ☐ Verify a socket cannot join/emit to another gym's room (server assigns rooms from the JWT, client never self-joins).

## Injection / data
- ✅ Prisma parameterised queries throughout (no string-built SQL except `SELECT 1` health probe).
- ☐ Verify no `$queryRawUnsafe` / dynamic SQL with user input.
- ☐ NoSQL/operator injection N/A (Postgres + Prisma).

## XSS / CSRF
- ✅ Web is a token-auth SPA (no cookie session) → CSRF surface minimal; `Authorization` header, not cookies.
- ✅ Security headers on web (`vercel.json`: X-Frame-Options DENY, nosniff, Referrer-Policy).
- ☐ Verify announcement/chat/white-label text is rendered as text (React escapes by default) — confirm no `dangerouslySetInnerHTML` with user content. Email HTML is server-built from fixed templates.
- ☐ Confirm white-label `logoUrl`/color inputs are URL/string-validated before render.

## File upload
- ✅ `uploadLimiter` (10/min) on `/uploads`; Cloudinary-backed; progress-photo upload removed in Stage 5.
- ☐ Verify content-type/size limits + that uploads can't be used to store executable/HTML served same-origin.

## Rate limiting (Stage 10 additions)
- ✅ Auth (20/15m), uploads (10/min), global API (200/min).
- ✅ **Payments** (`paymentLimiter` 30/min), **Chat** (`chatLimiter` 60/min), **Broadcasts/Announcements** (`broadcastLimiter` 30/hr).

## Audit & compliance
- ✅ `audit` module + `createAuditLog`; billing/membership/admin actions audited.
- ✅ Stage 10: **feature-flag changes** audited + `logSecurity()` security-channel log; white-label changes guarded to ADMIN.
- ☐ Verify audit log entries are immutable (no update/delete route exposed).

## Secrets & config
- ✅ No hardcoded secrets (Razorpay/SMTP/JWT via env). CDN config env-driven.
- ☐ Verify `.env` not committed; production secrets via Render/Vercel/EAS secret stores.

## Transport / headers
- ☐ Enforce HTTPS at the edge (Render/Vercel terminate TLS); HSTS at the proxy.
- ✅ CORS allow-list via `CORS_ORIGIN` (no wildcard in production).

## Sign-off
A release is security-cleared when all ☐ items are verified and the one ⚠️ (refresh rotation) has an accepted risk decision or is implemented.
