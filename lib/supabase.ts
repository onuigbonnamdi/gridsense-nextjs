import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

export const sessionReady = supabase.auth.getSession().then(({ data }) => {
  return data.session
})

export function getTier(user: any): string {
  return (
    user?.app_metadata?.tier ||
    user?.user_metadata?.tier ||
    'free'
  )
}

export const PAID_TIERS = new Set([
  'essential','premier','elite',
  'core_starter','core_pro','pro_growth','pro_scale',
  'enterprise_pilot','enterprise_council'
])

export function hasTier(user: any, min: string): boolean {
  const ORDER = ['free','essential','premier','elite','core_starter','core_pro','pro_growth','pro_scale','enterprise_pilot','enterprise_council']
  const userRank = ORDER.indexOf(getTier(user))
  const minRank  = ORDER.indexOf(min)
  return userRank >= minRank
}
