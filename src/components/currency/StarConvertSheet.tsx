import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useStarConvert } from '../../hooks/useCurrency'
import { useRefreshProfile } from '../../hooks/useProfile'

interface StarConvertSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: (magicGained: number) => void
  childId: string
  currentStars: number
}

export function StarConvertSheet({ open, onClose, onSuccess, childId, currentStars }: StarConvertSheetProps) {
  const [times, setTimes] = useState(1)
  const { convert, loading } = useStarConvert()
  const refreshProfile = useRefreshProfile()

  const maxTimes = Math.floor(currentStars / 5)
  const starsSpent = times * 5
  const magicGained = times

  const handleConfirm = async () => {
    const { error } = await convert(childId, starsSpent)
    if (error) {
      alert(error.message)
      return
    }
    await refreshProfile()
    onClose()
    setTimes(1)
    onSuccess?.(magicGained)
  }

  const handleClose = () => {
    setTimes(1)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="⭐ 星星升级魔法星">
      <div className="space-y-6 py-2">
        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-600 font-semibold">当前星星</p>
          <p className="text-4xl font-black text-amber-500 mt-1">{currentStars} ⭐</p>
          <p className="text-xs text-amber-400 mt-1">可升级 {maxTimes} 次</p>
        </div>

        {maxTimes === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">星星不足 5 颗，继续完成任务赚取星星吧！</p>
        ) : (
          <>
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
              <span className="text-gray-700 font-bold">升级次数</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTimes(t => Math.max(1, t - 1))}
                  className="w-9 h-9 rounded-full bg-white shadow text-gray-600 font-black text-lg flex items-center justify-center"
                  disabled={times <= 1}
                >
                  −
                </button>
                <span className="text-2xl font-black text-violet-600 w-8 text-center">{times}</span>
                <button
                  onClick={() => setTimes(t => Math.min(maxTimes, t + 1))}
                  className="w-9 h-9 rounded-full bg-white shadow text-gray-600 font-black text-lg flex items-center justify-center"
                  disabled={times >= maxTimes}
                >
                  ＋
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-black text-amber-500">−{starsSpent} ⭐</p>
                <p className="text-xs text-gray-400 mt-0.5">消耗星星</p>
              </div>
              <span className="text-2xl text-gray-300">→</span>
              <div className="text-center">
                <p className="text-2xl font-black text-violet-600">+{magicGained} 🌟</p>
                <p className="text-xs text-gray-400 mt-0.5">获得魔法星</p>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full min-h-14 rounded-3xl bg-violet-600 text-white font-black text-lg disabled:opacity-50"
            >
              {loading ? '升级中…' : '确认升级'}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
