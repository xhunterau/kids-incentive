import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskCompletion, Task, Profile } from '../types'

export function useSubmitCompletion() {
  const submit = async (taskId: string, childId: string, note: string) => {
    const { error } = await supabase.from('task_completions').insert({
      task_id: taskId,
      child_id: childId,
      note: note.trim() || null,
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
