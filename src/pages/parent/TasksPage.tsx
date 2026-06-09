import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useParentTasks, type TaskFormValues } from '../../hooks/useTasks'
import { TaskForm } from '../../components/tasks/TaskForm'
import { BottomSheet } from '../../components/ui/BottomSheet'
import type { Task } from '../../types'

const RECURRENCE_LABEL: Record<string, string> = {
  once: '一次性',
  daily: '每日',
  weekly: '每周',
  milestone: '里程碑',
}

export default function ParentTasksPage() {
  const { profile } = useAuth()
  const { tasks, profiles, loading, createTask, updateTask, archiveTask } =
    useParentTasks(profile!.family_id!)

  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleCreate = async (values: TaskFormValues) => {
    const { error } = await createTask(values, profile!.id)
    if (error) throw new Error(error.message)
    setShowCreate(false)
  }

  const handleUpdate = async (values: TaskFormValues) => {
    if (!editingTask) return
    const { error } = await updateTask(editingTask.id, values)
    if (error) throw new Error(error.message)
    setEditingTask(null)
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]))
  const activeTasks = tasks.filter(t => t.status === 'active')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 font-bold">加载中…</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full mb-4 py-4 bg-violet-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        ＋ 新建任务
      </button>

      {activeTasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-bold">还没有任务</p>
          <p className="text-sm mt-1">点击上方新建第一个任务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTasks.map(task => {
            const assignee = task.assigned_to ? profileMap.get(task.assigned_to) : null
            return (
              <div key={task.id} className="bg-white rounded-[20px] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{task.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                        {RECURRENCE_LABEL[task.recurrence]}
                      </span>
                      {task.stars_reward > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                          ⭐ {task.stars_reward}
                        </span>
                      )}
                      {task.magic_stars_reward > 0 && (
                        <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-bold">
                          🌟 {task.magic_stars_reward}
                        </span>
                      )}
                      <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">
                        {assignee
                          ? `${assignee.avatar_emoji} ${assignee.display_name}`
                          : '所有孩子'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="text-xs text-violet-600 font-bold px-3 py-1.5 rounded-lg bg-violet-50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => archiveTask(task.id)}
                      className="text-xs text-red-400 font-bold px-3 py-1.5 rounded-lg bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BottomSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建任务"
      >
        <TaskForm
          familyProfiles={profiles}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="编辑任务"
      >
        {editingTask && (
          <TaskForm
            familyProfiles={profiles}
            initial={editingTask}
            onSave={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </BottomSheet>
    </div>
  )
}
