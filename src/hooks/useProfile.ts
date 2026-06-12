import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Profile } from '../types'

export function useRefreshProfile() {
  const { user, setProfile } = useAuthStore()

  return useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data as Profile)
  }, [user?.id])
}

export function useProfileRealtime() {
  const { user, setProfile } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])
}
