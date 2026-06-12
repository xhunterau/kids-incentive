import { useAuth } from '../../hooks/useAuth'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { EmptyState } from '../../components/ui/EmptyState'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { profile } = useAuth()
  const familyId = profile?.family_id ?? null
  const { entries, loading } = useLeaderboard(familyId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 font-bold">加载中…</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-3xl">🏆</span>
        <h1 className="text-2xl font-black text-gray-800">排行榜</h1>
      </div>

      <div className="bg-white/60 rounded-2xl px-4 py-2 mb-5 text-center">
        <p className="text-xs text-gray-400 font-bold">按金豆豆数量排名 · 实时更新</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState emoji="🪙" title="暂无排行数据" subtitle="完成任务赚取金豆豆，登上排行榜！" />
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const isMe = entry.id === profile?.id
            const medal = MEDAL[i] ?? `${i + 1}`
            const isTop3 = i < 3

            return (
              <div
                key={entry.id}
                className={`
                  flex items-center gap-4 rounded-[20px] p-4 transition-all
                  ${isMe
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : 'bg-white shadow-sm'
                  }
                  ${i === 0 ? 'scale-[1.02]' : ''}
                  animate-slide-up
                `}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  {isTop3
                    ? <span className="text-2xl leading-none">{medal}</span>
                    : <span className={`text-lg font-black ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  isMe ? 'bg-white/20' : 'bg-gray-50'
                }`}>
                  {entry.avatar_emoji}
                </div>

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-black text-base truncate ${isMe ? 'text-white' : 'text-gray-800'}`}>
                      {entry.display_name}
                    </p>
                    {isMe && (
                      <span className="text-[10px] font-black bg-white/25 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        我
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs font-bold ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>
                      ⭐ {entry.stars}
                    </span>
                    <span className={`text-xs font-bold ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>
                      完成 {entry.total_tasks_completed} 个
                    </span>
                  </div>
                </div>

                {/* Gold beans */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-xl font-black ${isMe ? 'text-white' : 'text-green-600'}`}>
                    {entry.gold_beans}
                  </span>
                  <span className={`text-[10px] font-bold ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                    🪙 金豆豆
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
