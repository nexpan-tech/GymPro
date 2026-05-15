import axios from "axios";
import { storage } from "./storage";
import { API_BASE } from "@/constants/api";

const apiInstance = axios.create({
  baseURL: API_BASE || "http://localhost:5000/api",
  withCredentials: true,
});

apiInstance.interceptors.request.use((config) => {
  const token = storage.getToken();

  if (token) {
    const headers = config.headers ?? {};
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    config.headers = headers;
  }

  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      storage.removeToken();
    }

    return Promise.reject(error);
  }
);

export const api = apiInstance;
export default apiInstance;
