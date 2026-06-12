import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrencyTransaction } from '../types'

export function useTransactions(childId: string | undefined) {
  const [transactions, setTransactions] = useState<CurrencyTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - 7)
    const { data } = await supabase
      .from('currency_transactions')
      .select('*')
      .eq('child_id', childId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
    setTransactions((data ?? []) as CurrencyTransaction[])
    setLoading(false)
  }, [childId])

  useEffect(() => { fetch() }, [fetch])

  return { transactions, loading, refetch: fetch }
}

export function useStarConvert() {
  const [loading, setLoading] = useState(false)

  const convert = async (childId: string, starsSpent: number) => {
    setLoading(true)
    const magicStarsGained = starsSpent / 5
    const { error } = await supabase
      .from('star_conversions')
      .insert({ child_id: childId, stars_spent: starsSpent, magic_stars_gained: magicStarsGained })
    setLoading(false)
    return { error }
  }

  return { convert, loading }
}

export function useSpendBeans() {
  const [loading, setLoading] = useState(false)

  const spend = async (childId: string, amount: number, note?: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('bean_redemptions')
      .insert({ child_id: childId, amount, note: note?.trim() || null })
    setLoading(false)
    return { error }
  }

  return { spend, loading }
}
