export type { Database } from './database'
import type { Database } from './database'

export type UserRole = Database['public']['Enums']['user_role']
export type TaskRecurrence = Database['public']['Enums']['task_recurrence']
export type TaskStatus = Database['public']['Enums']['task_status']
export type CompletionStatus = Database['public']['Enums']['completion_status']
export type CurrencyType = Database['public']['Enums']['currency_type']
export type TxDirection = Database['public']['Enums']['tx_direction']
export type TxSource = Database['public']['Enums']['tx_source']

export type Family = Database['public']['Tables']['families']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskCompletion = Database['public']['Tables']['task_completions']['Row']
export type StarConversion = Database['public']['Tables']['star_conversions']['Row']
export type ShopProduct = Database['public']['Tables']['shop_products']['Row']
export type ShopPurchase = Database['public']['Tables']['shop_purchases']['Row']
export type BeanRedemption = Database['public']['Tables']['bean_redemptions']['Row']
export type CurrencyTransaction = Database['public']['Tables']['currency_transactions']['Row']

export type TaskWithCompletion = Task & {
  my_completion?: TaskCompletion | null
}
