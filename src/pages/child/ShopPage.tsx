import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useShopProducts } from '../../hooks/useShop'
import { ProductCard } from '../../components/shop/ProductCard'
import { PurchaseConfirmSheet } from '../../components/shop/PurchaseConfirmSheet'
import { BeanRain } from '../../components/ui/BeanRain'
import type { ShopProduct } from '../../types'

export default function ChildShopPage() {
  const { profile } = useAuth()
  const { products, loading } = useShopProducts()
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)
  const [beanRainActive, setBeanRainActive] = useState(false)
  const [beanRainGained, setBeanRainGained] = useState(0)

  if (!profile) return null

  const handlePurchaseSuccess = (beansGained: number) => {
    setBeanRainGained(beansGained)
    setBeanRainActive(true)
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <BeanRain
        active={beanRainActive}
        gained={beanRainGained}
        onDone={() => setBeanRainActive(false)}
      />

      {/* 余额提示 */}
      <div className="flex items-center justify-between bg-violet-50 rounded-2xl px-4 py-3">
        <span className="text-sm font-semibold text-violet-700">当前魔法星</span>
        <span className="text-2xl font-black text-violet-600">{profile.magic_stars} 🌟</span>
      </div>

      {/* 商品列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-[20px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              currentMagicStars={profile.magic_stars}
              onBuy={setSelectedProduct}
            />
          ))}
        </div>
      )}

      <PurchaseConfirmSheet
        open={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onSuccess={handlePurchaseSuccess}
        product={selectedProduct}
        childId={profile.id}
        currentMagicStars={profile.magic_stars}
      />
    </div>
  )
}
