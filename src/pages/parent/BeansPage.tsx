import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Profile, BeanRedemption } from '../../types'

interface ChildRedemptions {
  child: Profile
  redemptions: BeanRedemption[]
}

export default function BeansPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<ChildRedemptions[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.family_id) return

    async function load() {
      setLoading(true)

      const { data: children } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', profile!.family_id!)
        .eq('role', 'child')
        .order('display_name', { ascending: true })

      if (!children || children.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      const childIds = children.map(c => c.id)
      const { data: redemptions } = await supabase
        .from('bean_redemptions')
        .select('*')
        .in('child_id', childIds)
        .order('created_at', { ascending: false })

      const byChild: ChildRedemptions[] = (children as Profile[]).map(child => ({
        child,
        redemptions: ((redemptions ?? []) as BeanRedemption[]).filter(r => r.child_id === child.id),
      }))

      setData(byChild)
      setLoading(false)
    }

    load()
  }, [profile?.family_id])

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      <h1 className="text-xl font-black text-gray-800">🪙 金豆豆消费记录</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🪙</p>
          <p className="text-sm">暂无消费记录</p>
        </div>
      ) : (
        data.map(({ child, redemptions }) => (
          <ChildSection key={child.id} child={child} redemptions={redemptions} />
        ))
      )}
    </div>
  )
}

function ChildSection({ child, redemptions }: { child: Profile; redemptions: BeanRedemption[] }) {
  const total = redemptions.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="bg-white rounded-[20px] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-green-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{child.avatar_emoji}</span>
          <span className="font-black text-gray-800">{child.display_name}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">累计消费</p>
          <p className="font-black text-green-600">{total} 🪙</p>
        </div>
      </div>

      {redemptions.length === 0 ? (
        <p className="text-center text-gray-300 text-sm py-5">暂无消费记录</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {redemptions.map(r => (
            <RedemptionRow key={r.id} redemption={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function RedemptionRow({ redemption }: { redemption: BeanRedemption }) {
  const date = new Date(redemption.created_at)
  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  return (
    <div className="flex items-center px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-400">{dateStr}</p>
        {redemption.note && (
          <p className="text-sm font-semibold text-gray-700 mt-0.5 truncate">{redemption.note}</p>
        )}
      </div>
      <span className="font-black text-red-500">−{redemption.amount} 🪙</span>
    </div>
  )
}
