import type { ShopProduct } from '../../types'

interface ProductCardProps {
  product: ShopProduct
  currentMagicStars: number
  onBuy: (product: ShopProduct) => void
}

const BADGE: Record<number, { label: string; color: string } | undefined> = {
  2: { label: '有折扣', color: 'bg-orange-100 text-orange-600' },
  3: { label: '最划算', color: 'bg-violet-100 text-violet-600' },
}

export function ProductCard({ product, currentMagicStars, onBuy }: ProductCardProps) {
  const canAfford = currentMagicStars >= product.magic_stars_cost
  const badge = BADGE[product.sort_order]

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{product.emoji}</span>
            <span className="font-black text-gray-800 text-lg">{product.name}</span>
          </div>
          {product.description && (
            <p className="text-xs text-gray-400 mt-1">{product.description}</p>
          )}
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-3 bg-gray-50 rounded-2xl mb-4">
        <div className="text-center">
          <p className="text-2xl font-black text-violet-600">{product.magic_stars_cost} 🌟</p>
          <p className="text-xs text-gray-400 mt-0.5">消耗魔法星</p>
        </div>
        <span className="text-xl text-gray-300">→</span>
        <div className="text-center">
          <p className="text-2xl font-black text-green-600">{product.gold_beans_reward} 🪙</p>
          <p className="text-xs text-gray-400 mt-0.5">获得金豆豆</p>
        </div>
      </div>

      <button
        onClick={() => onBuy(product)}
        disabled={!canAfford}
        className="w-full min-h-14 rounded-3xl font-black text-base transition-all
          enabled:bg-indigo-500 enabled:text-white enabled:active:scale-95
          disabled:bg-gray-100 disabled:text-gray-400"
      >
        {canAfford ? '立即购买 →' : '魔法星不足'}
      </button>
    </div>
  )
}
