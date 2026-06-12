import type { CurrencyTransaction, TxSource, CurrencyType } from '../../types'

const SOURCE_LABEL: Record<TxSource, string> = {
  task_reward: '任务奖励',
  star_conversion: '星星升级',
  shop_purchase: '商店购买',
  bean_spend: '金豆豆消费',
  parent_adjustment: '家长调整',
}

const CURRENCY_ICON: Record<CurrencyType, string> = {
  star: '⭐',
  magic_star: '🌟',
  gold_bean: '🪙',
}

interface TransactionListProps {
  transactions: CurrencyTransaction[]
  loading: boolean
}

export function TransactionList({ transactions, loading }: TransactionListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-sm">近 7 天暂无流水记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map(tx => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  )
}

function TransactionRow({ tx }: { tx: CurrencyTransaction }) {
  const icon = CURRENCY_ICON[tx.currency]
  const isCredit = tx.direction === 'credit'
  const sign = isCredit ? '+' : '−'
  const amountColor = isCredit ? 'text-green-600' : 'text-red-500'

  const date = new Date(tx.created_at)
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  return (
    <div className="flex items-center bg-white rounded-2xl px-4 py-3 gap-3">
      <div className="text-2xl w-9 text-center leading-none">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate">
          {SOURCE_LABEL[tx.source]}
        </p>
        {tx.note && (
          <p className="text-xs text-gray-400 truncate">{tx.note}</p>
        )}
        <p className="text-xs text-gray-300 mt-0.5">{dateStr}</p>
      </div>
      <span className={`font-black text-lg ${amountColor}`}>
        {sign}{tx.amount}
      </span>
    </div>
  )
}
