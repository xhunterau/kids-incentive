import type { MilestoneCompletion } from '../../hooks/useTasks'

interface Props {
  item: MilestoneCompletion
}

export function MilestoneCompletionCard({ item }: Props) {
  const { completion, task } = item
  const isApproved = completion.status === 'approved'

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-white/60">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl leading-none mt-0.5">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-gray-800 text-base">{task.title}</h3>
            {isApproved ? (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                ✓ 已批准
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                审批中
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3 space-y-1">
        <p className="text-xs text-gray-400">
          🕐 {new Date(completion.created_at).toLocaleString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
        {completion.note && (
          <p className="text-xs text-gray-600 italic">「{completion.note}」</p>
        )}
        {isApproved && completion.reviewed_at && (
          <p className="text-xs text-green-500">
            ✓ {new Date(completion.reviewed_at).toLocaleString('zh-CN', {
              month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })} 批准
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {(completion.stars_reward ?? task.stars_reward) > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-bold">
            ⭐ +{completion.stars_reward ?? task.stars_reward}
          </span>
        )}
        {(completion.magic_stars_reward ?? task.magic_stars_reward) > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-sm font-bold">
            🌟 +{completion.magic_stars_reward ?? task.magic_stars_reward}
          </span>
        )}
      </div>
    </div>
  )
}
