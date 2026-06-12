import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Profile } from '../../types'

interface ChildStats {
  profile: Profile
  weeklyCompleted: number
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday)
  return weekStart.toISOString()
}

export default function ParentDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<ChildStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!profile?.family_id) return
    setLoading(true)

    const [{ data: children }, { data: completions }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('role', 'child')
        .order('display_name'),
      supabase
        .from('task_completions')
        .select('child_id, created_at')
        .eq('status', 'approved')
        .gte('created_at', getWeekStart()),
    ])

    const weeklyMap = new Map<string, number>()
    completions?.forEach(c => {
      weeklyMap.set(c.child_id, (weeklyMap.get(c.child_id) ?? 0) + 1)
    })

    setStats(
      (children ?? []).map(p => ({
        profile: p as Profile,
        weeklyCompleted: weeklyMap.get(p.id) ?? 0,
      }))
    )
    setLoading(false)
  }, [profile?.family_id])

  useEffect(() => { fetchStats() }, [fetchStats])

  const maxMagicStars = Math.max(...stats.map(s => s.profile.magic_stars), 1)

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <span className="text-gray-400 text-sm">加载中…</span>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-black text-slate-700">📊 家庭看板</h1>

      {/* 魔法星排名 */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 mb-4">🌟 魔法星排名</h2>
        <div className="space-y-4">
          {[...stats]
            .sort((a, b) => b.profile.magic_stars - a.profile.magic_stars)
            .map((s, i) => {
              const pct = Math.max((s.profile.magic_stars / maxMagicStars) * 100, 4)
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={s.profile.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">
                      {medals[i] ?? '🏅'} {s.profile.avatar_emoji} {s.profile.display_name}
                    </span>
                    <span className="text-sm font-black text-violet-600">
                      {s.profile.magic_stars} 🌟
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: i === 0
                          ? 'linear-gradient(90deg, #a855f7, #7c3aed)'
                          : 'linear-gradient(90deg, #c4b5fd, #a78bfa)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* 本周完成任务 */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 mb-4">✅ 本周完成任务</h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div
              key={s.profile.id}
              className="bg-violet-50 rounded-2xl p-4 text-center"
            >
              <div className="text-3xl mb-1">{s.profile.avatar_emoji}</div>
              <div className="font-black text-slate-700 text-sm">{s.profile.display_name}</div>
              <div className="text-3xl font-black text-violet-600 mt-1">
                {s.weeklyCompleted}
              </div>
              <div className="text-xs text-slate-400">次</div>
            </div>
          ))}
        </div>
      </div>

      {/* 余额总览 */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 mb-4">💰 货币余额总览</h2>
        <div className="space-y-3">
          {stats.map(s => (
            <div key={s.profile.id} className="flex items-center gap-3">
              <span className="text-xl">{s.profile.avatar_emoji}</span>
              <span className="font-bold text-slate-700 w-16 shrink-0">{s.profile.display_name}</span>
              <div className="flex gap-3 flex-1 justify-end text-sm font-bold">
                <span className="text-yellow-500">⭐ {s.profile.stars}</span>
                <span className="text-violet-500">🌟 {s.profile.magic_stars}</span>
                <span className="text-green-500">🪙 {s.profile.gold_beans}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
