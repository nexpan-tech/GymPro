// Platform support contact — configuration (NOT mocked data). Override per
// deployment via Vite env vars; sensible defaults otherwise. The gym's own
// subscription/license status on the Support page is fetched live.
const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

export const SUPPORT = {
  companyName: env.VITE_SUPPORT_COMPANY ?? "Nexpan Tech",
  email: env.VITE_SUPPORT_EMAIL ?? "support@gympro.app",
  phone: env.VITE_SUPPORT_PHONE ?? "+91 80000 00000",
  hours: env.VITE_SUPPORT_HOURS ?? "Mon–Sat · 9:00 AM – 7:00 PM IST",
  docsUrl: env.VITE_SUPPORT_DOCS ?? "https://docs.gympro.app",
};
