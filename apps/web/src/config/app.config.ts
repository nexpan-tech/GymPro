export const APP_CONFIG = {
  appName: "GymPro",
  appDescription: "Multi-tenant Gym Management SaaS",
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5050/api",
  defaultTheme: "light" as "light" | "dark",
};