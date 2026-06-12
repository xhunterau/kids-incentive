import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useRefreshProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { AvatarPicker } from '../../components/ui/AvatarPicker'
import { BottomSheet } from '../../components/ui/BottomSheet'

export default function ProfilePage() {
  const { profile } = useAuth()
  const refreshProfile = useRefreshProfile()

  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [pendingAvatar, setPendingAvatar] = useState(profile?.avatar_emoji ?? '🐼')
  const [saving, setSaving] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  function startEditName() {
    setNameInput(profile?.display_name ?? '')
    setEditingName(true)
  }

  async function saveDisplayName() {
    if (!profile || !nameInput.trim()) return
    setNameSaving(true)
    await supabase
      .from('profiles')
      .update({ display_name: nameInput.trim() })
      .eq('id', profile.id)
    await refreshProfile()
    setNameSaving(false)
    setEditingName(false)
  }

  if (!profile) return null

  const handleSaveAvatar = async () => {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ avatar_emoji: pendingAvatar })
      .eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setShowAvatarPicker(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const statItems = [
    { emoji: '✅', label: '完成任务', value: profile.total_tasks_completed, unit: '个' },
    { emoji: '⭐', label: '当前星星', value: profile.stars, unit: '' },
    { emoji: '🌟', label: '魔法星', value: profile.magic_stars, unit: '' },
    { emoji: '🪙', label: '金豆豆', value: profile.gold_beans, unit: '' },
  ]

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Profile card */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm mb-4 flex flex-col items-center gap-3">
        <button
          onClick={() => { setPendingAvatar(profile.avatar_emoji); setShowAvatarPicker(true) }}
          className="relative group"
        >
          <div className="w-24 h-24 rounded-3xl bg-violet-50 flex items-center justify-center text-5xl shadow-inner active:scale-95 transition-transform">
            {profile.avatar_emoji}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow">
            ✎
          </div>
        </button>
        <div className="text-center">
          {editingName ? (
            <div className="flex items-center gap-2 justify-center">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                maxLength={20}
                autoFocus
                className="text-xl font-black text-gray-800 text-center border-b-2 border-violet-400 outline-none bg-transparent w-36"
                onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
              />
              <button
                onClick={saveDisplayName}
                disabled={nameSaving || !nameInput.trim()}
                className="text-violet-600 font-black text-sm disabled:opacity-40"
              >
                {nameSaving ? '…' : '保存'}
              </button>
              <button onClick={() => setEditingName(false)} className="text-gray-400 text-sm font-bold">取消</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 justify-center">
              <h1 className="text-2xl font-black text-gray-800">{profile.display_name}</h1>
              <button onClick={startEditName} className="text-violet-400 text-sm leading-none">✎</button>
            </div>
          )}
          <p className="text-sm text-gray-400 font-bold mt-0.5">点击头像更换</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {statItems.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center animate-slide-up">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-gray-800">{s.value}{s.unit}</div>
            <div className="text-xs text-gray-400 font-bold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-gray-100 text-gray-500 font-black rounded-2xl py-4 active:scale-95 transition-transform"
      >
        退出登录
      </button>

      {/* Avatar picker sheet */}
      <BottomSheet open={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} title="选择头像">
        <div className="space-y-5">
          <AvatarPicker value={pendingAvatar} onChange={setPendingAvatar} disabled={saving} />
          <button
            onClick={handleSaveAvatar}
            disabled={saving}
            className="w-full py-4 bg-violet-600 text-white font-black text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? '保存中…' : '保存头像'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
