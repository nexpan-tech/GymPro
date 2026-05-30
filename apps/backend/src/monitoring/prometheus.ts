import client from "prom-client";

// Initialize default metrics (memory, CPU, event loop lag, etc.)
client.collectDefaultMetrics({ prefix: "gympro_" });

// Create and export the registry
export const register = client.register;

// Helper to register custom metrics
export function registerMetric(metric: client.Metric) {
  try {
    register.registerMetric(metric);
  } catch (error: any) {
    // Metric already registered, skip
    if (!error.message?.includes("Duplicated timeseries")) {
      throw error;
    }
  }
}

// Export client for creating metrics
export { client };
