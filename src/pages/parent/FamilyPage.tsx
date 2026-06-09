import { supabase } from '../../lib/supabase'

export default function FamilyPage() {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-black text-violet-700">👨‍👧‍👦 家庭管理</h1>
      <p className="text-gray-400 mt-2">Coming soon…</p>
      <button
        onClick={handleSignOut}
        className="mt-6 w-full bg-gray-100 text-gray-600 font-bold rounded-2xl py-3"
      >
        退出登录
      </button>
    </div>
  )
}
