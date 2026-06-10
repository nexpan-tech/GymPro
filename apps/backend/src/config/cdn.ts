/**
 * Stage 10 — CDN configuration (preparation only; not wired to CloudFront yet).
 * When `enabled`, asset/upload URLs can be rewritten to `baseUrl`. Reads env so
 * no code change is needed to flip it on later.
 */
export const cdnConfig = {
  enabled: process.env.CDN_ENABLED === "true",
  provider: process.env.CDN_PROVIDER || "none", // "cloudfront" | "cloudflare" | "none"
  baseUrl: process.env.CDN_BASE_URL || "",
};

/** Rewrite an asset path to the CDN base URL when CDN is enabled. */
export function cdnUrl(path: string): string {
  if (!cdnConfig.enabled || !cdnConfig.baseUrl) return path;
  if (/^https?:\/\//.test(path)) return path; // already absolute
  return `${cdnConfig.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
