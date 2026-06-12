import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskCompletion, Task, Profile } from '../types'

export interface SubmitCompletionOptions {
  starsReward?: number | null
  magicStarsReward?: number | null
}

export function useSubmitCompletion() {
  const submit = async (
    taskId: string,
    childId: string,
    note: string,
    opts: SubmitCompletionOptions = {},
  ) => {
    const { error } = await supabase.from('task_completions').insert({
      task_id: taskId,
      child_id: childId,
      note: note.trim() || null,
      stars_reward: opts.starsReward ?? null,
      magic_stars_reward: opts.magicStarsReward ?? null,
    })
    return { error }
  }
  return { submit }
}

export interface PendingCompletion extends TaskCompletion {
  task: Task
  child: Profile
}

export function usePendingCompletions(familyId: string) {
  const [completions, setCompletions] = useState<PendingCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompletions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('task_completions')
      .select('*, task:tasks(*), child:profiles!task_completions_child_id_fkey(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    const filtered = ((data ?? []) as unknown as PendingCompletion[]).filter(
      c => (c.task as Task)?.family_id === familyId
    )
    setCompletions(filtered)
    setLoading(false)
  }, [familyId])

  useEffect(() => { fetchCompletions() }, [fetchCompletions])

  const approve = async (completionId: string, reviewerId: string) => {
    const { error } = await supabase
      .from('task_completions')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', completionId)
    if (!error) fetchCompletions()
    return { error }
  }

  const reject = async (completionId: string, reviewerId: string, reason: string) => {
    const { error } = await supabase
      .from('task_completions')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason.trim() || null,
      })
      .eq('id', completionId)
    if (!error) fetchCompletions()
    return { error }
  }

  return { completions, loading, approve, reject, refetch: fetchCompletions }
}

export function usePendingCount(familyId: string | null | undefined) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!familyId) return

    let cancelled = false

    async function fetch() {
      const { data } = await supabase
        .from('task_completions')
        .select('id, task:tasks!inner(family_id)')
        .eq('status', 'pending')
        .eq('task.family_id', familyId!)

      if (!cancelled) setCount(data?.length ?? 0)
    }

    fetch()

    const channel = supabase
      .channel(`pending_count:${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, fetch)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [familyId])

  return count
}
