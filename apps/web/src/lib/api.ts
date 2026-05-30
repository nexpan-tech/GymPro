import axios from 'axios'

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5050'

export const api = axios.create({
  baseURL: BASE_URL + '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

// Response: handle 401 (token expired) and normalize errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(BASE_URL + '/api/v1/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', data.data.accessToken)
        originalRequest.headers.Authorization = 'Bearer ' + data.data.accessToken
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
  pagination?: { total: number; page: number; limit: number; totalPages: number }
}
