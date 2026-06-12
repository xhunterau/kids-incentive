import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ShopProduct } from '../types'

export function useShopProducts() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('shop_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setProducts((data ?? []) as ShopProduct[])
        setLoading(false)
      })
  }, [])

  return { products, loading }
}

export function usePurchaseProduct() {
  const [loading, setLoading] = useState(false)

  const purchase = async (childId: string, productId: string, magicStarsCost: number, goldBeansReward: number) => {
    setLoading(true)
    const { error } = await supabase
      .from('shop_purchases')
      .insert({
        child_id: childId,
        product_id: productId,
        magic_stars_spent: magicStarsCost,
        gold_beans_received: goldBeansReward,
      })
    setLoading(false)
    return { error }
  }

  return { purchase, loading }
}
