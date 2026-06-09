import { useState } from 'react'
import type { Profile, Task } from '../../types'
import type { TaskFormValues } from '../../hooks/useTasks'
import type { TaskRecurrence } from '../../types'

const EMOJIS = ['📝', '📐', '✏️', '📚', '🧹', '🫧', '🏃', '🎨', '🎵', '🧮', '🌿', '⭐', '🦷', '🚿', '🛏️', '🍳', '🎸', '🏓', '🏸', '🎹', '💧', '🪥', '😊', '🧘']

const RECURRENCE_OPTIONS: { value: TaskRecurrence; label: string }[] = [
  { value: 'once', label: '一次性' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'milestone', label: '里程碑' },
]

interface TaskFormProps {
  familyProfiles: Profile[]
  initial?: Partial<Task>
  onSave: (values: TaskFormValues) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ familyProfiles, initial, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📝')
  const [stars, setStars] = useState(initial?.stars_reward ?? 5)
  const [magicStars, setMagicStars] = useState(initial?.magic_stars_reward ?? 0)
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(initial?.recurrence ?? 'daily')
  const [assignedTo, setAssignedTo] = useState<string | null>(initial?.assigned_to ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const childProfiles = familyProfiles.filter(p => p.role === 'child')

  const handleSave = async () => {
    if (!title.trim()) { setError('请输入任务名称'); return }
    if (stars === 0 && magicStars === 0) { setError('至少设置一种积分奖励'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        emoji,
        stars_reward: stars,
        magic_stars_reward: magicStars,
        recurrence,
        assigned_to: assignedTo,
        due_date: null,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Emoji picker */}
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-2">任务图标</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                emoji === e ? 'bg-violet-100 ring-2 ring-violet-500' : 'bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-2">任务名称 *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例：完成数学作业"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-2">描述（可选）</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="任务详情…"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400"
        />
      </div>

      {/* Recurrence */}
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-2">任务周期</label>
        <div className="flex gap-2">
          {RECURRENCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRecurrence(opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                recurrence === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned to */}
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-2">指派给</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setAssignedTo(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              assignedTo === null ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            所有孩子
          </button>
          {childProfiles.map(child => (
            <button
              key={child.id}
              onClick={() => setAssignedTo(child.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                assignedTo === child.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {child.avatar_emoji} {child.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-3">积分奖励（至少一种）</label>
        <div className="grid grid-cols-2 gap-3">
          <RewardStepper
            icon="⭐"
            label="星星"
            value={stars}
            onChange={setStars}
            textColor="text-amber-600"
            bg="bg-amber-50"
          />
          <RewardStepper
            icon="🌟"
            label="魔法星"
            value={magicStars}
            onChange={setMagicStars}
            textColor="text-violet-600"
            bg="bg-violet-50"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

      <div className="flex gap-3 pb-2">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] py-4 rounded-2xl bg-violet-600 text-white font-black disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存任务'}
        </button>
      </div>
    </div>
  )
}

function RewardStepper({
  icon, label, value, onChange, textColor, bg,
}: {
  icon: string
  label: string
  value: number
  onChange: (v: number) => void
  textColor: string
  bg: string
}) {
  return (
    <div className={`${bg} rounded-2xl p-3`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xl leading-none">{icon}</span>
        <span className={`text-sm font-bold ${textColor}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full bg-white font-black text-gray-600 flex items-center justify-center shadow-sm"
        >
          −
        </button>
        <span className={`flex-1 text-center font-black text-xl ${textColor}`}>{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full bg-white font-black text-gray-600 flex items-center justify-center shadow-sm"
        >
          +
        </button>
      </div>
    </div>
  )
}
