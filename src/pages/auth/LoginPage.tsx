import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && profile) navigate('/', { replace: true })
  }, [profile, authLoading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 to-indigo-50 flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">⭐</div>
        <h1 className="text-3xl font-black text-violet-700">星星乐园</h1>
        <p className="text-violet-400 mt-1 text-sm">完成任务，赢取奖励！</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-6 space-y-4"
      >
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
    </div>
  )
}
