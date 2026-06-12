import { BottomSheet } from '../ui/BottomSheet'
import { usePurchaseProduct } from '../../hooks/useShop'
import { useRefreshProfile } from '../../hooks/useProfile'
import type { ShopProduct } from '../../types'

interface PurchaseConfirmSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: (beansGained: number) => void
  product: ShopProduct | null
  childId: string
  currentMagicStars: number
}

export function PurchaseConfirmSheet({
  open,
  onClose,
  onSuccess,
  product,
  childId,
  currentMagicStars,
}: PurchaseConfirmSheetProps) {
  const { purchase, loading } = usePurchaseProduct()
  const refreshProfile = useRefreshProfile()

  if (!product) return null

  const afterBalance = currentMagicStars - product.magic_stars_cost

  const handleConfirm = async () => {
    const { error } = await purchase(childId, product.id, product.magic_stars_cost, product.gold_beans_reward)
    if (error) {
      alert(error.message)
      return
    }
    await refreshProfile()
    onClose()
    onSuccess?.(product.gold_beans_reward)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="确认购买">
      <div className="space-y-5 py-2">
        <div className="text-center">
          <span className="text-5xl">{product.emoji}</span>
          <p className="text-xl font-black text-gray-800 mt-2">{product.name}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">消耗魔法星</span>
            <span className="font-black text-violet-600">−{product.magic_stars_cost} 🌟</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">获得金豆豆</span>
            <span className="font-black text-green-600">+{product.gold_beans_reward} 🪙</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-gray-500 text-sm">购买后余额</span>
            <span className="font-bold text-gray-700">{afterBalance} 🌟</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-3xl bg-gray-100 text-gray-600 font-bold"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-14 rounded-3xl bg-indigo-500 text-white font-black disabled:opacity-50"
          >
            {loading ? '购买中…' : '确认购买'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
