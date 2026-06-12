import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface LeaderboardEntry {
  id: string
  display_name: string
  avatar_emoji: string
  gold_beans: number
  magic_stars: number
  stars: number
  total_tasks_completed: number
}

export function useLeaderboard(familyId: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!familyId) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_emoji, gold_beans, magic_stars, stars, total_tasks_completed')
      .eq('family_id', familyId)
      .eq('role', 'child')
      .order('gold_beans', { ascending: false })
    setEntries((data ?? []) as LeaderboardEntry[])
    setLoading(false)
  }, [familyId])

  useEffect(() => { fetch() }, [fetch])

  // Realtime: subscribe to profile updates within this family
  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel(`leaderboard:${familyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => { fetch() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [familyId, fetch])

  return { entries, loading, refetch: fetch }
}
