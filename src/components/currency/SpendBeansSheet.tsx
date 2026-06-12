import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useSpendBeans } from '../../hooks/useCurrency'
import { useRefreshProfile } from '../../hooks/useProfile'

interface SpendBeansSheetProps {
  open: boolean
  onClose: () => void
  childId: string
  currentBeans: number
}

export function SpendBeansSheet({ open, onClose, childId, currentBeans }: SpendBeansSheetProps) {
  const [amount, setAmount] = useState(1)
  const [note, setNote] = useState('')
  const { spend, loading } = useSpendBeans()
  const refreshProfile = useRefreshProfile()

  const handleConfirm = async () => {
    const { error } = await spend(childId, amount, note)
    if (error) {
      alert(error.message)
      return
    }
    await refreshProfile()
    onClose()
    setAmount(1)
    setNote('')
  }

  const handleClose = () => {
    setAmount(1)
    setNote('')
    onClose()
  }

  const canConfirm = amount >= 1 && amount <= currentBeans

  return (
    <BottomSheet open={open} onClose={handleClose} title="🪙 消费金豆豆">
      <div className="space-y-5 py-2">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-green-600 font-semibold">当前余额</p>
          <p className="text-4xl font-black text-green-600 mt-1">{currentBeans} 🪙</p>
        </div>

        {currentBeans === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">没有金豆豆了，去商店购买吧！</p>
        ) : (
          <>
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
              <span className="text-gray-700 font-bold">消费数量</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAmount(a => Math.max(1, a - 1))}
                  className="w-9 h-9 rounded-full bg-white shadow text-gray-600 font-black text-lg flex items-center justify-center"
                  disabled={amount <= 1}
                >
                  −
                </button>
                <span className="text-2xl font-black text-green-600 w-8 text-center">{amount}</span>
                <button
                  onClick={() => setAmount(a => Math.min(currentBeans, a + 1))}
                  className="w-9 h-9 rounded-full bg-white shadow text-gray-600 font-black text-lg flex items-center justify-center"
                  disabled={amount >= currentBeans}
                >
                  ＋
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-2">
                消费原因（可选）
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="例如：买了冰淇淋"
                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-violet-400"
                maxLength={50}
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || !canConfirm}
              className="w-full min-h-14 rounded-3xl bg-green-500 text-white font-black text-lg disabled:opacity-50"
            >
              {loading ? '处理中…' : `确认支付 ${amount} 🪙`}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
