import type { TaskWithStatus } from '../../hooks/useTasks'

interface TaskCardProps {
  task: TaskWithStatus
  onSubmit: (task: TaskWithStatus) => void
}

export function TaskCard({ task, onSubmit }: TaskCardProps) {
  const config = {
    todo: {
      badge: null,
      btnLabel: '完成任务 →',
      btnClass: 'bg-violet-600 text-white active:scale-95',
      disabled: false,
    },
    pending: {
      badge: (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
          审批中
        </span>
      ),
      btnLabel: '等待审批…',
      btnClass: 'bg-gray-100 text-gray-400 cursor-not-allowed',
      disabled: true,
    },
    done: {
      badge: (
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
          ✓ 已完成
        </span>
      ),
      btnLabel: '已完成',
      btnClass: 'bg-green-50 text-green-500 cursor-not-allowed',
      disabled: true,
    },
  } as const

  const cfg = config[task.displayStatus]

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-white/60">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl leading-none mt-0.5">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-gray-800 text-base">{task.title}</h3>
            {cfg.badge}
            {task.recurrence === 'milestone' && task.pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                审批中 {task.pendingCount} 次
              </span>
            )}
            {task.recurrence === 'milestone' && task.completionCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold">
                🏆 {task.completionCount} 次
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
          )}
        </div>
      </div>

      {task.displayStatus === 'done' && task.completion && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3 space-y-1">
          <p className="text-xs text-gray-400">
            🕐 {new Date(task.completion.created_at).toLocaleString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {task.completion.note && (
            <p className="text-xs text-gray-400 italic">「{task.completion.note}」</p>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {task.stars_reward > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-bold">
            ⭐ +{task.stars_reward}
          </span>
        )}
        {task.magic_stars_reward > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-sm font-bold">
            🌟 +{task.magic_stars_reward}
          </span>
        )}
      </div>

      <button
        onClick={() => { if (!cfg.disabled) onSubmit(task) }}
        disabled={cfg.disabled}
        className={`w-full py-3.5 rounded-2xl font-black text-base transition-transform ${cfg.btnClass}`}
      >
        {cfg.btnLabel}
      </button>
    </div>
  )
}
