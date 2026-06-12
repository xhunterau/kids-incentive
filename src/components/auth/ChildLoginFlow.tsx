import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import PinPad from './PinPad'

interface ChildProfile {
  id: string
  display_name: string
  avatar_emoji: string
}

interface ChildLoginFlowProps {
  onSuccess: (session: { access_token: string; refresh_token: string }) => void
  onSwitchToParent?: () => void
}

export default function ChildLoginFlow({ onSuccess, onSwitchToParent }: ChildLoginFlowProps) {
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [selected, setSelected] = useState<ChildProfile | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-children-for-login`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } },
        )
        const data = await res.json()
        setChildren(Array.isArray(data) ? data : [])
      } catch {
        setChildren([])
      } finally {
        setLoadingChildren(false)
      }
    }
    load()
  }, [])

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && selected) {
      handleLogin()
    }
  }, [pin])

  async function handleLogin() {
    if (!selected || pin.length !== 4) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/child-pin-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ child_id: selected.id, pin }),
        },
      )
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? '登录失败')
        setPin('')
        return
      }

      // Exchange the server-side token_hash for a real client session
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        token_hash: json.token_hash,
        type: 'magiclink',
      })

      if (otpError || !otpData?.session) {
        setError('登录失败，请重试')
        setPin('')
        return
      }

      onSuccess({ access_token: otpData.session.access_token, refresh_token: otpData.session.refresh_token })
    } catch {
      setError('网络错误，请重试')
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingChildren) {
    return <p className="text-center text-violet-300 py-8">加载中…</p>
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-5xl">👨‍👩‍👧</div>
        <p className="text-slate-400 text-sm text-center">还没有孩子账号</p>
        {onSwitchToParent && (
          <button
            onClick={onSwitchToParent}
            className="bg-violet-500 text-white font-black rounded-2xl px-6 py-3 text-sm active:scale-95 transition-transform"
          >
            家长登录去创建
          </button>
        )}
      </div>
    )
  }

  // Step 1: choose profile
  if (!selected) {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm font-bold text-slate-500">选择你的头像</p>
        <div className="grid grid-cols-2 gap-3">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => { setSelected(child); setPin(''); setError('') }}
              className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-5xl">{child.avatar_emoji}</span>
              <span className="font-black text-slate-700">{child.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: enter PIN
  return (
    <div className="space-y-4">
      <button
        onClick={() => { setSelected(null); setPin(''); setError('') }}
        className="text-violet-400 text-sm font-bold flex items-center gap-1"
      >
        ← 重新选择
      </button>

      <div className="text-center">
        <span className="text-5xl">{selected.avatar_emoji}</span>
        <p className="mt-2 font-black text-lg text-slate-700">{selected.display_name}</p>
        <p className="text-sm text-slate-400 mt-0.5">输入 4 位 PIN</p>
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2 font-bold">
          {error}
        </p>
      )}

      <PinPad value={pin} onChange={setPin} disabled={submitting} />

      {submitting && (
        <p className="text-center text-violet-400 text-sm font-bold animate-pulse">验证中…</p>
      )}
    </div>
  )
}
