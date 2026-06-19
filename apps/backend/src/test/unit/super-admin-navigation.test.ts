import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Tests run from apps/backend; the web app is one level up.
const WEB_SRC = resolve(process.cwd(), "../web/src");

function superAdminNavPaths(): string[] {
  const src = readFileSync(resolve(WEB_SRC, "config/navigation.ts"), "utf8");
  const start = src.indexOf("const SUPER_ADMIN_NAV");
  const end = src.indexOf("];", start);
  const block = src.slice(start, end);
  return [...block.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]).filter((p) => p.startsWith("/super-admin/"));
}

describe("Super Admin sidebar navigation integrity", () => {
  const paths = superAdminNavPaths();
  const routes = readFileSync(resolve(WEB_SRC, "routes/index.tsx"), "utf8");

  it("has no duplicate nav entries", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every nav path resolves to a registered route (no broken links)", () => {
    for (const p of paths) {
      const segment = p.replace("/super-admin/", "");
      expect(routes).toContain(`path: "${segment}"`);
    }
  });

  it("the operations pages that were broken now exist", () => {
    expect(paths).toContain("/super-admin/metrics");
    expect(paths).toContain("/super-admin/system");
    expect(paths).toContain("/super-admin/queues");
    expect(routes).toContain('path: "metrics"');
    expect(routes).toContain('path: "system"');
    expect(routes).toContain('path: "queues"');
  });
});
