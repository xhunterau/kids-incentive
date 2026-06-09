import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function ProfilePage() {
  const { profile } = useAuth()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-black text-indigo-600">👤 个人中心</h1>
      {profile && (
        <div className="mt-4 bg-white rounded-3xl p-5 shadow-sm">
          <div className="text-5xl text-center mb-2">{profile.avatar_emoji}</div>
          <p className="text-center font-black text-xl text-gray-700">{profile.display_name}</p>
          <p className="text-center text-gray-400 text-sm mt-1">已完成 {profile.total_tasks_completed} 个任务</p>
        </div>
      )}
      <button
        onClick={handleSignOut}
        className="mt-6 w-full bg-gray-100 text-gray-600 font-bold rounded-2xl py-3"
      >
        退出登录
      </button>
    </div>
  )
}
