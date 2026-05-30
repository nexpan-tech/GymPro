import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { User } from '@/types/user.types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterGymPayload {
  gymName: string
  ownerName: string
  email: string
  password: string
  phone?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export const authService = {
  /**
   * Authenticate user and return tokens + user profile.
   */
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthTokens>> => {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/login', payload)
    const { accessToken, refreshToken } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    return res.data
  },

  /**
   * Register a new gym with an owner account.
   */
  registerGym: async (payload: RegisterGymPayload): Promise<ApiResponse<AuthTokens>> => {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/register-gym', payload)
    const { accessToken, refreshToken } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    return res.data
  },

  /**
   * Fetch the currently authenticated user's profile.
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    const res = await api.get<ApiResponse<User>>('/auth/me')
    return res.data
  },

  /**
   * Refresh the access token using the stored refresh token.
   */
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    const refreshToken = localStorage.getItem('refreshToken')
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken })
    localStorage.setItem('accessToken', res.data.data.accessToken)
    return res.data
  },

  /**
   * Change authenticated user's password.
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse<null>> => {
    const res = await api.post<ApiResponse<null>>('/auth/change-password', payload)
    return res.data
  },

  /**
   * Send a password reset email.
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ApiResponse<null>> => {
    const res = await api.post<ApiResponse<null>>('/auth/forgot-password', payload)
    return res.data
  },

  /**
   * Reset password using the token received via email.
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponse<null>> => {
    const res = await api.post<ApiResponse<null>>('/auth/reset-password', payload)
    return res.data
  },

  /**
   * Log out and clear stored tokens.
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  },
}
