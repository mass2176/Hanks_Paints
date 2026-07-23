import { apiBaseUrl } from './config'

export type ShopUser = {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'employee'
}

const tokenKey = 'hanks_paints_shop_token'
const userKey = 'hanks_paints_shop_user'

export function getShopToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(tokenKey) || ''
}

export function getStoredShopUser(): ShopUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(userKey)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeShopSession(token: string, user: ShopUser) {
  window.localStorage.setItem(tokenKey, token)
  window.localStorage.setItem(userKey, JSON.stringify(user))
}

export function clearShopSession() {
  window.localStorage.removeItem(tokenKey)
  window.localStorage.removeItem(userKey)
}

export async function shopFetch(path: string, init: RequestInit = {}) {
  const token = getShopToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(`${apiBaseUrl}${path}`, { ...init, headers })
}

export async function loadCurrentShopUser() {
  const res = await shopFetch('/auth/me')
  if (!res.ok) {
    clearShopSession()
    throw new Error('Shop login required')
  }
  const user = await res.json()
  window.localStorage.setItem(userKey, JSON.stringify(user))
  return user as ShopUser
}
