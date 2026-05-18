// src/constants/api.ts

import axios from "axios";

/**
 * Base API URL from environment variables.
 * Example:
 * VITE_API_URL=http://localhost:3000/api
 */
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Axios instance used throughout the frontend.
 */
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor:
 * Automatically attaches JWT token from localStorage.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * Handles unauthorized responses.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Redirect to login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

