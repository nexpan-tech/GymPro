import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Tests run from apps/backend.
const SRC = resolve(process.cwd(), "src");
const read = (p: string) => readFileSync(resolve(SRC, p), "utf8");

/**
 * Access control: the whole Super Admin surface (platform data + SaaS billing +
 * feature-flag management + gym CRUD) must be SUPER_ADMIN only — no gym-admin
 * access. We assert it structurally at the route layer.
 */
describe("Super Admin access control", () => {
  it("super-admin routes gate the entire router on SUPER_ADMIN", () => {
    const src = read("modules/super-admin/super-admin.routes.ts");
    expect(src).toMatch(/router\.use\(\s*authMiddleware\s*,\s*roleMiddleware\(\[ROLES\.SUPER_ADMIN\]\)\s*\)/);
    // No other role appears in the file.
    expect(src).not.toMatch(/ROLES\.ADMIN|ROLES\.TRAINER|ROLES\.MEMBER|ROLES\.RECEPTIONIST/);
  });

  it("super-admin routes are mounted in the app", () => {
    const app = read("app.ts");
    expect(app).toContain('app.use("/api/v1/super-admin", superAdminRoutes)');
  });

  it("feature-flag management (admin CRUD) is SUPER_ADMIN only", () => {
    const src = read("modules/feature-flag/feature-flag.routes.ts");
    // The /admin CRUD routes use the SA (SUPER_ADMIN) guard.
    expect(src).toMatch(/const SA = roleMiddleware\(\[ROLES\.SUPER_ADMIN\]\)/);
    expect(src).toMatch(/router\.post\("\/admin", SA, controller\.createFlag\)/);
    expect(src).toMatch(/router\.put\("\/admin\/:key", SA, controller\.updateFlag\)/);
    expect(src).toMatch(/router\.delete\("\/admin\/:key", SA, controller\.deleteFlag\)/);
  });

  it("gym CRUD remains SUPER_ADMIN only", () => {
    const src = read("modules/gym/gym.routes.ts");
    expect(src).toMatch(/requireRoles\("SUPER_ADMIN"\)/);
  });
});
