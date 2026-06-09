import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from './client'

// ─── Types ───────────────────────────────────────────────

export interface Tokens {
  access_token: string
  refresh_token: string
}

/**
 * Normalized user object stored in Zustand
 * Each backend response shape is mapped to this unified shape
 */
export interface AuthUser {
  id: string
  user_type: 'brand' | 'app' | 'admin'
  role: string
  brand_id: string
  /** display name (name / nickname / username) */
  display_name: string
}

const routeGuardCookieNames = ['brand_access_token', 'app_access_token'] as const
const routeGuardCookieMaxAge = 60 * 60 * 24

function cookieOptions(maxAge: number): string {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''

  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function setRouteGuardCookie(user: AuthUser, accessToken: string): void {
  if (typeof document === 'undefined' || user.user_type === 'admin') {
    return
  }

  document.cookie = `${user.user_type}_access_token=${encodeURIComponent(
    accessToken,
  )}; ${cookieOptions(routeGuardCookieMaxAge)}`
}

function clearRouteGuardCookies(): void {
  if (typeof document === 'undefined') {
    return
  }

  for (const name of routeGuardCookieNames) {
    document.cookie = `${name}=; ${cookieOptions(0)}`
  }
}

// ─── Store ───────────────────────────────────────────────

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean

  login: (tokens: Tokens, user: AuthUser) => void
  logout: () => void
  updateToken: (tokens: Tokens) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: (tokens, user) => {
        setRouteGuardCookie(user, tokens.access_token)
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        clearRouteGuardCookies()
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        })
      },

      updateToken: (tokens) =>
        set((state) => {
          if (state.user) {
            setRouteGuardCookie(state.user, tokens.access_token)
          }

          return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          }
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ─── Login request types ─────────────────────────────────

export interface BrandLoginRequest {
  phone: string
  password: string
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AppLoginRequest {
  code: string
  brand_id: string
  nickname?: string
}

/**
 * Brand login: phone + password
 * Backend response: { access_token, refresh_token, user: { id, name, phone, brand_id } }
 */
export function useBrandLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BrandLoginRequest) => {
      const res = await http.post<{
        access_token: string
        refresh_token: string
        user: { id: string; name: string; phone: string; brand_id: string }
      }>('/api/v1/brand/login', data)
      return res
    },
    onSuccess: (data) => {
      useAuthStore.getState().login(
        { access_token: data.access_token, refresh_token: data.refresh_token },
        {
          id: String(data.user.id),
          user_type: 'brand',
          role: 'admin',
          brand_id: String(data.user.brand_id),
          display_name: data.user.name,
        }
      )
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

/**
 * Admin login: username + password
 */
export function useAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AdminLoginRequest) => {
      const res = await http.post<{
        access_token: string
        refresh_token: string
        user?: { id: string; username: string; role: string }
      }>('/api/v1/admin/login', data)
      return res
    },
    onSuccess: (data) => {
      useAuthStore.getState().login(
        { access_token: data.access_token, refresh_token: data.refresh_token },
        {
          id: String(data.user?.id ?? ''),
          user_type: 'admin',
          role: data.user?.role ?? 'operator',
          brand_id: '',
          display_name: data.user?.username ?? '',
        }
      )
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

/**
 * App login: WeChat code
 * Backend response: { access_token, refresh_token, user: { id, brand_id, nickname, avatar_url, vip_level }, is_new_user }
 */
export function useAppLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AppLoginRequest) => {
      const res = await http.post<{
        access_token: string
        refresh_token: string
        user: {
          id: string
          brand_id: string
          nickname: string
          avatar_url: string
          vip_level: string
        }
        is_new_user: boolean
      }>('/api/v1/app/auth/wechat-login', data)
      return res
    },
    onSuccess: (data) => {
      useAuthStore.getState().login(
        { access_token: data.access_token, refresh_token: data.refresh_token },
        {
          id: String(data.user.id),
          user_type: 'app',
          role: data.user.vip_level === 'vip' ? 'vip' : 'normal',
          brand_id: String(data.user.brand_id),
          display_name: data.user.nickname,
        }
      )
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}
