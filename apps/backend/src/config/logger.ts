const isDev = process.env.NODE_ENV !== "production";

const format = (level: string, message: string, data?: any) => {
  return `[${new Date().toISOString()}] [${level}] ${message} ${
    data ? JSON.stringify(data) : ""
  }`;
};

export const logger = {
  info: (message: string, data?: any) => {
    console.log(format("INFO", message, data));
  },

  warn: (message: string, data?: any) => {
    console.warn(format("WARN", message, data));
  },

  error: (message: string, data?: any) => {
    console.error(format("ERROR", message, data));
  },

  debug: (message: string, data?: any) => {
    if (isDev) {
      console.log(format("DEBUG", message, data));
    }
  },
};