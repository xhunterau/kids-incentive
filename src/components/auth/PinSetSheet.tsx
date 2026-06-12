import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import PinPad from './PinPad'

interface PinSetSheetProps {
  childId: string
  childName: string
  childEmoji: string
  onClose: () => void
  onSuccess: () => void
}

type Step = 'enter' | 'confirm'

export default function PinSetSheet({ childId, childName, childEmoji, onClose, onSuccess }: PinSetSheetProps) {
  const [step, setStep] = useState<Step>('enter')
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleFirst(pin: string) {
    setFirst(pin)
    if (pin.length === 4) {
      setStep('confirm')
    }
  }

  async function handleSecond(pin: string) {
    setSecond(pin)
    if (pin.length !== 4) return

    if (pin !== first) {
      setError('两次 PIN 不一致，请重新设置')
      setFirst('')
      setSecond('')
      setStep('enter')
      return
    }

    setError('')
    setSaving(true)

    try {
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-child-pin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ child_id: childId, pin }),
        },
      )
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? '设置失败')
        setFirst('')
        setSecond('')
        setStep('enter')
      } else {
        onSuccess()
      }
    } catch {
      setError('网络错误，请重试')
      setFirst('')
      setSecond('')
      setStep('enter')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-700">
            {step === 'enter' ? '设置 PIN' : '再次确认 PIN'}
          </h2>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">×</button>
        </div>

        <div className="text-center">
          <span className="text-4xl">{childEmoji}</span>
          <p className="mt-1 font-bold text-slate-600">{childName}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {step === 'enter' ? '输入新的 4 位 PIN' : '再输入一次以确认'}
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2 font-bold">
            {error}
          </p>
        )}

        {step === 'enter' ? (
          <PinPad value={first} onChange={handleFirst} disabled={saving} />
        ) : (
          <PinPad value={second} onChange={handleSecond} disabled={saving} />
        )}

        {saving && (
          <p className="text-center text-violet-400 text-sm font-bold animate-pulse">保存中…</p>
        )}
      </div>
    </div>
  )
}
