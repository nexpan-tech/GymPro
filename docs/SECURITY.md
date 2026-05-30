# GymPro Security Guide

> Last updated: 2026-05-30
> Audience: backend engineers, DevOps, and security reviewers

---

## 1. Security Architecture Overview

GymPro follows a **defense-in-depth** strategy: no single layer is trusted to be the last line of defense. Security controls are layered at the network, transport, application, and data levels so that the compromise of one layer does not expose the system.

```
[ Internet ]
     |
[ Nginx ]          — TLS termination, HSTS, reverse proxy
     |
[ Express App ]    — Helmet headers, CORS whitelist, rate limiting, request IDs
     |
[ Auth Middleware ] — JWT validation, role enforcement, tenant isolation
     |
[ Business Logic ]  — Input validation, parameterized queries (Prisma ORM)
     |
[ PostgreSQL ]      — Row-level data, audit log table
     |
[ Redis ]           — Session store, brute-force counters, refresh-token allow-list
```

Every HTTP request traverses all layers. A malicious request must defeat each control independently.

### Security Principles Applied

| Principle | How GymPro Implements It |
|---|---|
| Least privilege | RBAC roles grant minimum permissions for each persona |
| Fail secure | Brute-force guard fails open (lets request through) only when Redis is unavailable, but still logs the attempt |
| Defense in depth | Headers, rate limits, auth, RBAC, tenant scope — independent layers |
| Separation of concerns | Auth, audit, and rate-limit logic live in dedicated middleware, not business code |
| Auditability | Every mutating request is written to `AuditLog` before the handler runs |

---

## 2. Authentication System

### JWT Access Tokens

- Algorithm: **HS256** (symmetric, secret stored in `JWT_SECRET`)
- Lifetime: **15 minutes** — short enough to limit damage from token theft
- Payload: `sub` (userId), `gymId`, `role`, `sessionId`, `iat`, `exp`
- Transport: `Authorization: Bearer <token>` header — never a cookie, never a query string

### Refresh Tokens

- Lifetime: **7 days**
- Generation: cryptographically random 64-byte hex string (`crypto.randomBytes`)
- Storage: **SHA-256 hash** is stored in the database, never the raw token
  - If the database is breached the raw tokens cannot be replayed
- Rotation: every `/auth/refresh` call issues a **new** refresh token and invalidates the previous one (single-use design)
- Binding: stored alongside `sessionId` to enforce one-token-per-session

### Session Model

Every login creates a `Session` record with:

| Field | Purpose |
|---|---|
| `id` | UUID, referenced in the access-token payload |
| `userId` | Owning user |
| `gymId` | Tenant scope |
| `ipAddress` | IP at login time |
| `userAgent` | Browser / app at login time |
| `deviceInfo` | Parsed device metadata |
| `hashedRefreshToken` | SHA-256 of the current valid refresh token |
| `expiresAt` | Hard expiry (7 days) |
| `revokedAt` | Set on logout or forced revocation |

### Token Rotation on Refresh

```
Client                        Server
  |  POST /auth/refresh          |
  |  { refreshToken: "abc..." }  |
  |----------------------------->|
  |                              | 1. Hash incoming token
  |                              | 2. Look up Session by sessionId
  |                              | 3. Compare hash — reject if mismatch or revoked
  |                              | 4. Issue new accessToken + new refreshToken
  |                              | 5. Update hashedRefreshToken in DB (old is now invalid)
  |<-----------------------------|
  |  { accessToken, refreshToken }
```

### Session Revocation

- **Logout**: `revokedAt` is set on the session; subsequent refresh attempts return 401
- **Admin forced logout**: SUPER_ADMIN or BRANCH_MANAGER can revoke all sessions for a user
- **Password change**: all existing sessions for the user are invalidated immediately
- **Token theft detection**: if a refresh token is presented after rotation (replay attack), the entire session is revoked

---

## 3. Authorization — RBAC

### Role Hierarchy

```
SUPER_ADMIN
    |
REGIONAL_MANAGER
    |
BRANCH_MANAGER
    |
ADMIN
    |
RECEPTIONIST
    |
TRAINER
    |
MEMBER
```

Higher roles inherit the permissions of all roles below them within their tenant scope. `SUPER_ADMIN` additionally has cross-tenant access for platform administration.

### Role-to-API Access Mapping

| Role | Typical Access |
|---|---|
| `SUPER_ADMIN` | All modules, all gyms, billing, white-label, API platform config |
| `REGIONAL_MANAGER` | Analytics and reports across branches under their region |
| `BRANCH_MANAGER` | Full control within their branch: members, trainers, payments, campaigns |
| `ADMIN` | Member management, attendance, schedules — no billing or system config |
| `RECEPTIONIST` | Check-in, lead capture, basic member lookup |
| `TRAINER` | Own schedule, assigned members' workout/diet plans, progress logging |
| `MEMBER` | Own profile, own workout/diet/progress data, community features |

Route guards are applied at the middleware layer via `requireRole(...roles)` — not inside handlers — so access control cannot be accidentally bypassed by new feature code.

### Tenant Isolation

Every authenticated request carries `gymId` in the JWT payload. All Prisma queries in business logic are scoped with `where: { gymId: req.user.gymId }`. This is enforced by convention and code-review policy.

**Cross-tenant access prevention:**

- `gymId` is never accepted from the request body for data queries — it always comes from the validated token
- SUPER_ADMIN routes that accept an explicit `gymId` are separately guarded with `requireRole('SUPER_ADMIN')`
- Integration tests assert that a request authenticated for gym A cannot read or write gym B data

---

## 4. Transport Security

### HTTPS Enforcement via Nginx

All traffic to GymPro is terminated at Nginx over TLS. The Express app runs on a plain HTTP port (internal only) and is never exposed directly to the internet. Nginx configuration example:

```nginx
server {
    listen 80;
    server_name api.gympro.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.gympro.io;

    ssl_certificate     /etc/letsencrypt/live/api.gympro.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gympro.io/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HSTS Header

Set both at Nginx (above) and inside the Express Helmet config:

```ts
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  // ...
}));
```

`max-age=31536000` (1 year) instructs browsers to never attempt plain HTTP connections to this domain. Once a browser receives this header the enforcement is local and cannot be bypassed by a network attacker.

### SSL/TLS Configuration

- Minimum protocol: **TLS 1.2** (TLS 1.0 and 1.1 disabled)
- Preferred: **TLS 1.3** for all new connections
- Certificate: Let's Encrypt (auto-renewed via Certbot), or a CA-signed certificate for enterprise tenants
- Cipher suite: prefer ECDHE for forward secrecy

### CORS Whitelist

The allowed origins list is read from the `CORS_ORIGIN` environment variable as a comma-separated list. In production this must be an explicit list of frontend origins.

```ts
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);           // same-origin / server-to-server
    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
    if (allowedOrigins.includes(origin) || (isDev && isLocalhost))
      return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  }
}));
```

**Production rule:** `CORS_ORIGIN` must never be `*`. A wildcard CORS policy combined with `credentials: true` is rejected by browsers, but a wildcard without credentials would allow any website to call the API using a logged-in user's ambient session.

---

## 5. API Security Layers

### Helmet HTTP Headers

Helmet is configured in `app.ts` and sets the following security headers on every response:

| Header | What It Protects Against |
|---|---|
| `Content-Security-Policy` | XSS — restricts which scripts, styles, and resources the browser will load |
| `X-DNS-Prefetch-Control: off` | Information leakage via DNS pre-fetching |
| `X-Frame-Options: SAMEORIGIN` | Clickjacking — prevents the page being loaded in an iframe on another origin |
| `X-Content-Type-Options: nosniff` | MIME-type sniffing attacks — browser must respect declared Content-Type |
| `Strict-Transport-Security` | Protocol downgrade and cookie hijacking — see Section 4 |
| `Referrer-Policy: strict-origin-when-cross-origin` | Prevents sensitive URL paths leaking in the Referer header to third-party sites |
| `X-Permitted-Cross-Domain-Policies: none` | Prevents Adobe Flash/PDF from making cross-domain requests |
| `X-Powered-By` (removed) | Hides that the app runs on Express, reducing attacker reconnaissance |

`crossOriginEmbedderPolicy` is set to `false` because the frontend embeds third-party media (fitness video libraries).

### Rate Limiting

Rate limits are applied at three tiers using `express-rate-limit` with a Redis store so limits are enforced cluster-wide:

| Tier | Limit | Window | Applied To |
|---|---|---|---|
| Global | 300 requests | 15 minutes | All routes |
| Auth | 20 requests | 15 minutes | `/api/auth/*` via `authLimiter` |
| Upload | 10 requests | 1 minute | `/api/upload/*` via `uploadLimiter` |

The global limiter is defined in `app.ts`; the named limiters (`authLimiter`, `uploadLimiter`) are imported from `src/middleware/rateLimits.ts` and applied to their respective route groups.

When a limit is exceeded the server responds with **HTTP 429 Too Many Requests** and a `Retry-After` header.

### Request ID (X-Request-ID)

The `requestIdMiddleware` (applied before all route handlers) attaches a UUID v4 to every request:

```
X-Request-ID: 4f3a1b2c-7e9d-4a1f-83c0-2d6e8f1a3b5c
```

This ID is:
- Returned in the response so clients can quote it in support tickets
- Written to every log line for the request (Morgan + Winston)
- Included in Sentry error events for correlation
- Stored in the `AuditLog` record for that request

### Body Size Limit

```ts
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

Requests exceeding 10 MB are rejected before they reach any handler, preventing memory exhaustion from crafted large payloads. File uploads are handled via multipart/form-data through the upload module (which enforces its own per-file size limits) and do not go through the JSON body parser.

---

## 6. Brute Force Protection

Login brute-force protection is implemented in the auth service using Redis as a counter store.

### Algorithm

```
On POST /auth/login:
  key = "login_attempts:{ip}"

  1. count = INCR key
  2. If count === 1: EXPIRE key 900   (15 minutes sliding window)
  3. If count > 10:
       a. SET "login_lockout:{ip}" 1 EX 3600  (1-hour lockout)
       b. Return 429 { error: "Too many attempts. Try again in 1 hour." }
  4. If lockout key exists for IP:
       Return 429 before attempting credential check
  5. Validate credentials
  6. On success:
       DEL "login_attempts:{ip}"
       DEL "login_lockout:{ip}"
```

### Parameters

| Parameter | Value | Rationale |
|---|---|---|
| Max attempts | 10 per IP | Allows for typos while blocking automated attacks |
| Attempt window | 15 minutes | Resets counter if attacker pauses |
| Lockout duration | 1 hour | Enough friction to deter credential stuffing |
| Key granularity | Per IP | Per-username would enable account enumeration |

### Fail-Open Behavior

If the Redis connection is unavailable, the brute-force guard logs a warning and allows the request through. This is an intentional **availability-over-security** trade-off: a Redis outage should not lock all users out of the system. The trade-off is accepted because:

- The auth rate limiter (`authLimiter`) still applies as a secondary layer
- Sentry will alert on the Redis connection failure
- The monitoring runbook includes Redis recovery steps

### Clearing on Success

A successful login immediately deletes both the attempt counter and lockout key, so a legitimate user who was temporarily locked out is unblocked as soon as they authenticate correctly.

---

## 7. Audit Logging

### Middleware

`auditMiddleware` is registered in `app.ts` before all route handlers. It runs on every request and writes a record to the `AuditLog` table after the response is sent (using `res.on('finish', ...)`).

### Logged Fields

| Field | Source |
|---|---|
| `requestId` | `req.id` (from requestIdMiddleware) |
| `userId` | `req.user?.id` (null for unauthenticated requests) |
| `gymId` | `req.user?.gymId` |
| `role` | `req.user?.role` |
| `ip` | `req.ip` (trusted via `trust proxy 1`) |
| `method` | `req.method` |
| `path` | `req.path` |
| `statusCode` | `res.statusCode` |
| `action` | Derived from method + path (e.g., `member.create`) |
| `timestamp` | Server UTC timestamp |
| `userAgent` | `req.headers['user-agent']` |

### Compliance-Ready Trail

The `AuditLog` table is append-only by application policy: no `UPDATE` or `DELETE` operations are issued against it by any module. This ensures the audit trail cannot be tampered with through the application layer.

Audit log records are indexed on `(gymId, userId, timestamp)` for efficient compliance queries such as "all actions by user X in the last 30 days" or "all logins to gym Y last month".

The `/api/audit` routes allow BRANCH_MANAGER and above to query audit logs for their own tenant scope. SUPER_ADMIN can query across all tenants.

---

## 8. WebSocket Security

GymPro uses Socket.IO for real-time features (live attendance, notifications, class capacity updates).

### Authentication Middleware

JWT validation is enforced before any socket connection is accepted:

```ts
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
               || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Authentication required'));

  try {
    const payload = verifyAccessToken(token);
    socket.data.user = payload;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});
```

A connection that fails the `io.use()` middleware is rejected before any event handlers can be triggered.

### Room Authorization

After authentication, clients join rooms scoped to their `gymId`. Handlers verify `socket.data.user.gymId` before emitting or broadcasting any data. Cross-gym data cannot be accessed via WebSocket for the same reason it cannot be accessed via REST — the gym scope is enforced at the socket level, not the event level.

### Token Expiry

WebSocket connections are long-lived. If a client's access token expires during a session, the server does not immediately disconnect (this would cause reconnect storms). Instead, sensitive real-time events check `exp` on the cached payload. Clients are expected to silently refresh their access token and reconnect if they receive an authentication error event.

---

## 9. OWASP Top 10 Status

| OWASP Risk (2021) | Status | Mitigation in GymPro |
|---|---|---|
| A01 — Broken Access Control | Mitigated | RBAC middleware on all routes; tenant isolation via gymId from JWT; audit logging of all access |
| A02 — Cryptographic Failures | Mitigated | TLS 1.2+ enforced; HSTS; refresh tokens hashed with SHA-256; JWT signed with strong secret; passwords hashed with bcrypt (cost 12) |
| A03 — Injection | Mitigated | Prisma ORM with parameterized queries throughout; no raw SQL string concatenation; input validation via Zod schemas |
| A04 — Insecure Design | Partial | Threat modelling done for auth and payments; remaining modules to be reviewed in Q3 2026 |
| A05 — Security Misconfiguration | Mitigated | Helmet default headers; no debug endpoints in production; environment-specific config via `.env`; `trust proxy 1` set explicitly |
| A06 — Vulnerable Components | Ongoing | `npm audit` in CI pipeline; Dependabot configured; critical advisories block deployment |
| A07 — Auth & Session Management Failures | Mitigated | Short-lived JWTs (15 min); refresh token rotation; session revocation; brute-force protection; HTTPS-only |
| A08 — Software & Data Integrity Failures | Partial | Lockfile committed (`package-lock.json`); CI verifies lock integrity; supply-chain signing (Sigstore) planned |
| A09 — Security Logging & Monitoring | Mitigated | Audit log on every request; Sentry error tracking; Prometheus metrics; alerting on error rate spikes |
| A10 — Server-Side Request Forgery | Low Risk | GymPro does not fetch user-supplied URLs server-side; webhook integrations validate destination allowlists |

---

## 10. Secrets Management

### What Counts as a Secret

A secret is any value that grants access to a system, signs data, or identifies a private credential:

- Database connection strings (contain username, password, host)
- `JWT_SECRET` — compromise allows forging valid tokens for any user
- `REFRESH_TOKEN_SECRET` — same risk
- `REDIS_URL` (if password-protected)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SENTRY_DSN` (not high-risk but should stay private)
- Cloud storage credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- SMTP credentials
- Any third-party API key

### Where Secrets Live

| Environment | Location | Access |
|---|---|---|
| Local development | `.env` file in project root | Developer machines only |
| CI/CD | GitHub Actions Secrets / equivalent | Injected as env vars at build time |
| Staging / Production | Cloud secret manager (AWS Secrets Manager or equivalent) | Pulled at container startup |

**Non-negotiable rules:**

1. `.env` is in `.gitignore` — it is never committed
2. No secret value ever appears in source code, even as a fallback default
3. Logs must never contain secret values — audit middleware explicitly excludes `Authorization` headers and request bodies containing `password` fields
4. Pull requests are scanned by a secrets-detection tool (e.g., `trufflehog` or `gitleaks`) in CI

### Required Secrets

```
DATABASE_URL
JWT_SECRET              # minimum 32 random bytes, base64 or hex
REFRESH_TOKEN_SECRET    # minimum 32 random bytes, different from JWT_SECRET
REDIS_URL
CORS_ORIGIN             # comma-separated list of allowed frontend origins
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
SENTRY_DSN
SMTP_HOST
SMTP_USER
SMTP_PASS
NODE_ENV                # must be "production" in production
```

### Rotation Strategy

| Secret | Rotation Frequency | Rotation Impact |
|---|---|---|
| `JWT_SECRET` | Annually or on suspected compromise | All existing access tokens are immediately invalid; users must re-login |
| `REFRESH_TOKEN_SECRET` | Annually or on suspected compromise | All refresh tokens invalid; users must re-authenticate |
| Database password | Quarterly | Update connection string in secret manager; rolling restart |
| `STRIPE_SECRET_KEY` | On personnel change or compromise | Generate new key in Stripe dashboard; update secret manager |
| AWS access keys | Quarterly | Rotate via IAM; prefer IAM roles over long-lived keys |
| SMTP credentials | On personnel change | Update in secret manager |

After rotating `JWT_SECRET` or `REFRESH_TOKEN_SECRET`, revoke all active sessions in the database as well (set `revokedAt` on all `Session` records) to force clean re-authentication.

---

## 11. Incident Response (Security)

### Detection

| Signal | Source | Threshold |
|---|---|---|
| Spike in 401/403 responses | Prometheus + Grafana alert | >50 in 5 minutes |
| Login brute-force lockouts | Audit log query | >5 distinct IPs locked in 10 minutes |
| Unusual data export volume | Audit log (GET on bulk endpoints) | Manual review trigger |
| Unhandled exceptions | Sentry alert | Any new error fingerprint with >5 occurrences |
| Redis connection failure | Prometheus alert | `redis_connected` gauge drops to 0 |
| High error rate | Grafana alert on `http_requests_total{status=~"5.."}` | >1% of requests over 5 minutes |

### Containment

**Step 1 — Identify scope**
- Query `AuditLog` for the affected `userId` or `ip` range
- Determine which `gymId`(s) are impacted

**Step 2 — Revoke sessions**
```sql
-- Revoke all sessions for a compromised user
UPDATE "Session"
SET "revokedAt" = NOW()
WHERE "userId" = '<compromised-user-id>'
  AND "revokedAt" IS NULL;
```

**Step 3 — Block IPs (if attack is ongoing)**
- Add the attacking IP range to Nginx `deny` directives or firewall rules
- For cloud deployments: add to WAF IP block list

**Step 4 — Rotate secrets (if credentials are suspected compromised)**
- Follow the rotation steps in Section 10
- Force all sessions to re-authenticate

**Step 5 — Notify affected tenants**
- Contact gym owners via the admin email on their `Gym` record
- Provide a summary: what happened, what data may be affected, what GymPro has done

### Recovery Steps

1. Confirm the attack vector is closed (patch deployed or config updated)
2. Restore from backup if data integrity is in question (verify backup age and integrity first)
3. Re-enable any endpoints that were temporarily disabled during containment
4. Conduct a post-incident review within 5 business days
5. Update runbooks and detection thresholds based on findings
6. If personal data of EU residents was accessed, assess GDPR breach notification obligation (72-hour window from discovery)

---

## 12. Compliance Readiness

### GDPR Considerations

GymPro stores personal data for gym members: names, contact details, biometric progress data, payment records, and attendance history. Under GDPR, each gym operator is a **data controller** and GymPro (the platform) is a **data processor**.

| GDPR Requirement | Current Status | Notes |
|---|---|---|
| Lawful basis for processing | Gym operators responsible | GymPro provides the mechanism; operators configure consent |
| Data minimisation | Partial | Profile fields are optional; image uploads are opt-in |
| Right to access | Planned | Export endpoint to be added in v2.1 |
| Right to erasure (right to be forgotten) | Planned | Soft-delete exists; hard-delete with cascade planned |
| Data breach notification | Process defined | See Section 11 incident response |
| Data Processing Agreement | Required | Template DPA to be provided to gym operators |
| Cross-border transfers | Planned | Data residency configuration per tenant planned for enterprise tier |

### Audit Log Retention

Audit logs are the primary compliance artefact. Retention policy:

| Environment | Retention Period | Mechanism |
|---|---|---|
| Production | 2 years | Database partition with scheduled archival to S3 |
| Staging | 30 days | Automated deletion job |
| Development | No retention | Logs are ephemeral |

Archived logs are stored in S3 with **Object Lock** (WORM) to prevent tampering. Access to archived logs requires SUPER_ADMIN credentials.

### Data Deletion Endpoints (Planned — v2.1)

A `DELETE /api/members/:id/gdpr-erase` endpoint will:
1. Anonymise PII fields (replace name, email, phone with placeholder values)
2. Delete biometric and progress data
3. Retain anonymised transaction records for financial compliance
4. Write a `gdpr_erasure` event to the audit log
5. Confirm deletion to the requesting admin

### Consent Logging (Planned — v2.1)

A `ConsentLog` table will record:
- User ID, gym ID, consent type, version of privacy policy accepted
- Timestamp and IP at the time of acceptance
- Method of acceptance (checkbox on registration form, etc.)

This creates a legally defensible record that the member consented to data processing.

### Payment Data

GymPro does not store raw card numbers or CVVs. All payment data is handled by **Stripe**. GymPro stores only:
- Stripe `customerId`
- Stripe `paymentMethodId` (a reference token, not card data)
- Transaction metadata (amount, status, timestamp)

This scopes GymPro's PCI-DSS obligations to **SAQ A** (the lowest tier), as card data never touches GymPro servers.

---

## Appendix: Security Checklist for New Features

Before merging any new API route or module, verify:

- [ ] Route is protected by `authenticate` middleware (or intentionally public with documented reason)
- [ ] Route has `requireRole(...)` guard if it accesses non-public data
- [ ] All database queries include `gymId` scope from `req.user.gymId` (not from request body)
- [ ] Input is validated with a Zod schema before use
- [ ] No secret values are logged or returned in responses
- [ ] Rate limiting is considered for any endpoint that triggers email, SMS, or external API calls
- [ ] New secrets are documented in Section 10 and added to the CI secret scanning allowlist
- [ ] Audit middleware captures the action correctly (no sensitive fields in logged body)
