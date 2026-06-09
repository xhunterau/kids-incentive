import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskCompletion, Profile, TaskRecurrence } from '../types'

export type TaskDisplayStatus = 'todo' | 'pending' | 'done'

export interface TaskWithStatus extends Task {
  completion: TaskCompletion | null
  displayStatus: TaskDisplayStatus
  completionCount: number  // approved completions total (used by milestone tasks)
}

export function useChildTasks(childId: string) {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
      .or(`assigned_to.eq.${childId},assigned_to.is.null`)
      .order('created_at', { ascending: false })

    if (!tasksData || tasksData.length === 0) {
      setTasks([])
      setLoading(false)
      return
    }

    const taskIds = tasksData.map(t => t.id)
    const { data: completions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('child_id', childId)
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })

    // Keep only latest completion per task; also count approved completions
    const completionMap = new Map<string, TaskCompletion>()
    const approvedCountMap = new Map<string, number>()
    completions?.forEach(c => {
      if (!completionMap.has(c.task_id)) completionMap.set(c.task_id, c)
      if (c.status === 'approved') {
        approvedCountMap.set(c.task_id, (approvedCountMap.get(c.task_id) ?? 0) + 1)
      }
    })

    const enriched: TaskWithStatus[] = tasksData.map(task => {
      const completion = completionMap.get(task.id) ?? null
      const completionCount = approvedCountMap.get(task.id) ?? 0
      let displayStatus: TaskDisplayStatus = 'todo'
      if (completion?.status === 'pending') {
        displayStatus = 'pending'
      } else if (completion?.status === 'approved') {
        displayStatus = 'done'
      }
      return { ...task, completion, displayStatus, completionCount }
    })

    setTasks(enriched)
    setLoading(false)
  }, [childId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  return { tasks, loading, refetch: fetchTasks }
}

export interface TaskFormValues {
  title: string
  description: string
  emoji: string
  stars_reward: number
  magic_stars_reward: number
  recurrence: TaskRecurrence
  assigned_to: string | null
  due_date: string | null
}

export function useParentTasks(familyId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: tasksData }, { data: profilesData }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*')
        .eq('family_id', familyId),
    ])
    setTasks(tasksData ?? [])
    setProfiles(profilesData ?? [])
    setLoading(false)
  }, [familyId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createTask = async (values: TaskFormValues, parentId: string) => {
    const { error } = await supabase.from('tasks').insert({
      ...values,
      family_id: familyId,
      created_by: parentId,
    })
    if (!error) fetchAll()
    return { error }
  }

  const updateTask = async (id: string, values: Partial<TaskFormValues>) => {
    const { error } = await supabase.from('tasks').update(values).eq('id', id)
    if (!error) fetchAll()
    return { error }
  }

  const archiveTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'archived' })
      .eq('id', id)
    if (!error) fetchAll()
    return { error }
  }

  return { tasks, profiles, loading, createTask, updateTask, archiveTask, refetch: fetchAll }
}
