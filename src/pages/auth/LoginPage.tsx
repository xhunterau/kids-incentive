import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth, signInWithSession } from '../../hooks/useAuth'
import ChildLoginFlow from '../../components/auth/ChildLoginFlow'

type Tab = 'parent' | 'child'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('child')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && profile) navigate('/', { replace: true })
  }, [profile, authLoading])

  async function handleParentLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleChildSession(session: { access_token: string; refresh_token: string }) {
    try {
      await signInWithSession(session.access_token, session.refresh_token)
      // onAuthStateChange in useAuthInit will pick up the new session automatically
    } catch (err) {
      console.error('Session inject failed', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 to-indigo-50 flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">⭐</div>
        <h1 className="text-3xl font-black text-violet-700">星星乐园</h1>
        <p className="text-violet-400 mt-1 text-sm">完成任务，赢取奖励！</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Tab switcher */}
        <div className="flex">
          {(['child', 'parent'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-4 text-sm font-black transition-colors ${
                tab === t
                  ? 'text-violet-600 border-b-2 border-violet-500'
                  : 'text-slate-400 border-b-2 border-transparent'
              }`}
            >
              {t === 'child' ? '🧒 孩子登录' : '👨 家长登录'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'child' ? (
            <ChildLoginFlow onSuccess={handleChildSession} onSwitchToParent={() => setTab('parent')} />
          ) : (
            <form onSubmit={handleParentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-violet-400 transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-violet-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-black text-lg rounded-2xl py-4 transition-colors"
              >
                {loading ? '登录中…' : '登录 🚀'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
