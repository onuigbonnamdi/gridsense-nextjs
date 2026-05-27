import { supabase } from './supabase'

export const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.gridsense.evervia.co.uk'

let _cachedToken: string | null = null

if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data }) => {
    _cachedToken = data.session?.access_token || null
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    _cachedToken = session?.access_token || null
  })
}

export async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (_cachedToken) return _cachedToken
  const { data } = await supabase.auth.getSession()
  _cachedToken = data.session?.access_token || null
  return _cachedToken
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API}${path}`, { ...options, headers })
}

export async function getLive() {
  const r = await apiFetch('/live')
  if (!r.ok) throw new Error('Failed to fetch live data')
  const json = await r.json()
  return json.data ?? json
}

// Public — landing page hero chart, no auth required
export async function getForecastPreview() {
  const r = await fetch(`${API}/forecast/preview`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!r.ok) throw new Error(`Forecast preview failed: ${r.status}`)
  const json = await r.json()
  return json.data ?? json
}

// Authenticated — dashboard ForecastChart, requires login + tier
export async function getForecast() {
  const r = await apiFetch('/forecast/latest')
  if (!r.ok) throw new Error(`Failed to fetch forecast: ${r.status}`)
  const json = await r.json()
  return json.data ?? json
}

export async function getAlerts(postcode: string) {
  const r = await apiFetch(`/gridsense/alerts/${encodeURIComponent(postcode)}`)
  return r.json().then(d => ({ ok: r.ok, ...d }))
}

export async function getAddress(postcode: string) {
  const r = await apiFetch(`/address/${encodeURIComponent(postcode)}`)
  return r.json().then(d => ({ ok: r.ok, status: r.status, ...d }))
}

export async function createCheckout(tier: string, email: string) {
  const r = await apiFetch('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ tier, email, success_url: window.location.href, cancel_url: window.location.href }),
  })
  return r.json()
}