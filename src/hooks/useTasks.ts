import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskCompletion, Profile, TaskRecurrence } from '../types'

export type TaskDisplayStatus = 'todo' | 'pending' | 'done'

function getDisplayStatus(completion: TaskCompletion | null, recurrence: string): TaskDisplayStatus {
  if (!completion || recurrence === 'milestone') return 'todo'
  if (completion.status === 'pending') return 'pending'
  if (completion.status !== 'approved') return 'todo'

  if (recurrence === 'once') return 'done'

  const submittedAt = new Date(completion.created_at)
  const now = new Date()

  if (recurrence === 'daily') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return submittedAt >= todayStart ? 'done' : 'todo'
  }

  if (recurrence === 'weekly') {
    const day = now.getDay()
    const daysFromMonday = day === 0 ? 6 : day - 1
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday)
    return submittedAt >= weekStart ? 'done' : 'todo'
  }

  return 'todo'
}

export interface TaskWithStatus extends Task {
  completion: TaskCompletion | null
  displayStatus: TaskDisplayStatus
  completionCount: number  // approved completions total
  pendingCount: number     // pending completions total (milestone tasks)
}

export interface MilestoneCompletion {
  completion: TaskCompletion
  task: Task
}

export function useChildTasks(childId: string) {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([])
  const [milestoneCompletions, setMilestoneCompletions] = useState<MilestoneCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['active', 'archived'])
      .or(`assigned_to.eq.${childId},assigned_to.is.null`)
      .order('created_at', { ascending: false })

    if (!tasksData || tasksData.length === 0) {
      setTasks([])
      setMilestoneCompletions([])
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

    const taskMap = new Map(tasksData.map(t => [t.id, t]))
    const completionMap = new Map<string, TaskCompletion>()
    const approvedCountMap = new Map<string, number>()
    const pendingCountMap = new Map<string, number>()
    const milestoneCompletionsArr: MilestoneCompletion[] = []

    completions?.forEach(c => {
      if (!completionMap.has(c.task_id)) completionMap.set(c.task_id, c)
      if (c.status === 'approved') {
        approvedCountMap.set(c.task_id, (approvedCountMap.get(c.task_id) ?? 0) + 1)
      }
      if (c.status === 'pending') {
        pendingCountMap.set(c.task_id, (pendingCountMap.get(c.task_id) ?? 0) + 1)
      }
      const task = taskMap.get(c.task_id)
      if (task?.recurrence === 'milestone') {
        milestoneCompletionsArr.push({ completion: c, task })
      }
    })

    const enriched: TaskWithStatus[] = tasksData
      .filter(task => {
        if (task.status === 'archived') {
          return (approvedCountMap.get(task.id) ?? 0) > 0
        }
        return true
      })
      .map(task => {
        const completion = completionMap.get(task.id) ?? null
        const completionCount = approvedCountMap.get(task.id) ?? 0
        const pendingCount = pendingCountMap.get(task.id) ?? 0
        const displayStatus = task.status === 'archived'
          ? 'done'
          : getDisplayStatus(completion, task.recurrence)
        return { ...task, completion, displayStatus, completionCount, pendingCount }
      })

    setTasks(enriched)
    setMilestoneCompletions(milestoneCompletionsArr)
    setLoading(false)
  }, [childId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  return { tasks, milestoneCompletions, loading, refetch: fetchTasks }
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
