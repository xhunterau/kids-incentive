import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTransactions } from '../../hooks/useCurrency'
import { StarConvertSheet } from '../../components/currency/StarConvertSheet'
import { SpendBeansSheet } from '../../components/currency/SpendBeansSheet'
import { TransactionList } from '../../components/currency/TransactionList'
import { StarBurst } from '../../components/ui/StarBurst'
import { EmptyState } from '../../components/ui/EmptyState'

export default function ChildWalletPage() {
  const { profile } = useAuth()
  const { transactions, loading, refetch } = useTransactions(profile?.id)
  const [showConvert, setShowConvert] = useState(false)
  const [showSpend, setShowSpend] = useState(false)
  const [starBurstActive, setStarBurstActive] = useState(false)
  const [starBurstGained, setStarBurstGained] = useState(0)

  if (!profile) return null

  const handleConvertClose = () => {
    setShowConvert(false)
    refetch()
  }

  const handleConvertSuccess = (magicGained: number) => {
    setStarBurstGained(magicGained)
    setStarBurstActive(true)
  }

  const handleSpendClose = () => {
    setShowSpend(false)
    refetch()
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <StarBurst
        active={starBurstActive}
        gained={starBurstGained}
        onDone={() => setStarBurstActive(false)}
      />

      {/* 余额区 */}
      <div className="grid grid-cols-3 gap-3">
        <BalanceCard icon="⭐" value={profile.stars} label="星星" bg="from-amber-400 to-orange-400" />
        <BalanceCard icon="🌟" value={profile.magic_stars} label="魔法星" bg="from-violet-500 to-purple-600" />
        <BalanceCard icon="🪙" value={profile.gold_beans} label="金豆豆" bg="from-green-400 to-emerald-500" />
      </div>

      {/* 操作区 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowConvert(true)}
          className="bg-white rounded-[20px] p-4 text-left shadow-sm active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">⭐→🌟</p>
          <p className="font-black text-gray-800 text-sm">星星升级</p>
          <p className="text-xs text-gray-400 mt-0.5">5 ⭐ = 1 🌟</p>
        </button>
        <button
          onClick={() => setShowSpend(true)}
          className="bg-white rounded-[20px] p-4 text-left shadow-sm active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">🪙</p>
          <p className="font-black text-gray-800 text-sm">消费金豆豆</p>
          <p className="text-xs text-gray-400 mt-0.5">换取线下奖励</p>
        </button>
      </div>

      {/* 流水记录 */}
      <div>
        <h2 className="font-black text-gray-700 text-base mb-3">近 7 天流水</h2>
        {loading
          ? <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          : transactions.length === 0
            ? <EmptyState emoji="💸" title="暂无流水记录" subtitle="完成任务赚取奖励后在这里查看" />
            : <TransactionList transactions={transactions} loading={loading} />
        }
      </div>

      <StarConvertSheet
        open={showConvert}
        onClose={handleConvertClose}
        onSuccess={handleConvertSuccess}
        childId={profile.id}
        currentStars={profile.stars}
      />
      <SpendBeansSheet
        open={showSpend}
        onClose={handleSpendClose}
        childId={profile.id}
        currentBeans={profile.gold_beans}
      />
    </div>
  )
}

function BalanceCard({
  icon, value, label, bg,
}: {
  icon: string
  value: number
  label: string
  bg: string
}) {
  return (
    <div className={`rounded-[20px] p-4 bg-gradient-to-br ${bg} text-white text-center shadow-sm`}>
      <p className="text-2xl leading-none mb-1">{icon}</p>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
    </div>
  )
}
