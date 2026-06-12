import { useEffect, useState } from 'react'

interface RewardPopupProps {
  stars?: number
  magicStars?: number
  active: boolean
  onDone?: () => void
}

export function RewardPopup({ stars, magicStars, active, onDone }: RewardPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) { setVisible(false); return }
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 1400)
    return () => clearTimeout(t)
  }, [active])

  if (!visible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 animate-reward-pop">
        {(stars ?? 0) > 0 && (
          <div className="bg-white rounded-2xl px-5 py-3 shadow-xl border border-amber-100 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span className="text-xl font-black text-amber-500">+{stars}</span>
          </div>
        )}
        {(magicStars ?? 0) > 0 && (
          <div className="bg-white rounded-2xl px-5 py-3 shadow-xl border border-violet-100 flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <span className="text-xl font-black text-violet-600">+{magicStars}</span>
          </div>
        )}
      </div>
    </div>
  )
}
