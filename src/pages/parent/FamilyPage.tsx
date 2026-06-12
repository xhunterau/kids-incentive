import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Profile, Family } from '../../types'
import PinSetSheet from '../../components/auth/PinSetSheet'

const AVATAR_OPTIONS = ['🐼', '🦊', '🐻', '🐱', '🐶', '🐸', '🦁', '🐧', '🦄', '🐨', '🐯', '🐰']

export default function FamilyPage() {
  const { profile } = useAuth()
  const [family, setFamily] = useState<Family | null>(null)
  const [children, setChildren] = useState<Profile[]>([])
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  const [showAddChild, setShowAddChild] = useState(false)
  const [childForm, setChildForm] = useState({ email: '', password: '', display_name: '', avatar_emoji: '🐼' })
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const [pinTarget, setPinTarget] = useState<Profile | null>(null)
  const [pinSuccessId, setPinSuccessId] = useState<string | null>(null)

  const fetchFamily = useCallback(async () => {
    if (!profile?.family_id) return
    const [{ data: fam }, { data: kids }] = await Promise.all([
      supabase.from('families').select('*').eq('id', profile.family_id).single(),
      supabase.from('profiles').select('*').eq('family_id', profile.family_id).eq('role', 'child').order('display_name'),
    ])
    if (fam) { setFamily(fam as Family); setNameInput(fam.name) }
    setChildren((kids ?? []) as Profile[])
  }, [profile?.family_id])

  useEffect(() => { fetchFamily() }, [fetchFamily])

  async function saveName() {
    if (!family || !nameInput.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('families')
      .update({ name: nameInput.trim() })
      .eq('id', family.id)
    if (!error) {
      setFamily({ ...family, name: nameInput.trim() })
      setEditingName(false)
    }
    setSaving(false)
  }

  async function handleAddChild() {
    setAddError('')
    if (!childForm.email.trim() || !childForm.password || !childForm.display_name.trim()) {
      setAddError('请填写所有必填字段')
      return
    }
    setAddLoading(true)

    const session = (await supabase.auth.getSession()).data.session
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-child`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(childForm),
      }
    )
    const json = await res.json()

    if (!res.ok) {
      setAddError(json.error ?? '创建失败')
    } else {
      setShowAddChild(false)
      setChildForm({ email: '', password: '', display_name: '', avatar_emoji: '🐼' })
      fetchFamily()
    }
    setAddLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-black text-slate-700">👨‍👩‍👧‍👦 家庭管理</h1>

      {/* 家庭名称 */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-500">家庭名称</h2>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="text-violet-500 text-sm font-bold"
            >
              编辑
            </button>
          )}
        </div>
        {editingName ? (
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
              maxLength={30}
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={saving || !nameInput.trim()}
              className="bg-violet-500 text-white font-bold rounded-xl px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? '…' : '保存'}
            </button>
            <button
              onClick={() => { setEditingName(false); setNameInput(family?.name ?? '') }}
              className="bg-gray-100 text-gray-500 font-bold rounded-xl px-3 py-2 text-sm"
            >
              取消
            </button>
          </div>
        ) : (
          <p className="text-lg font-black text-slate-700">{family?.name ?? '—'}</p>
        )}
      </div>

      {/* 家庭成员 */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-500">家庭成员</h2>
          <button
            onClick={() => { setShowAddChild(true); setAddError('') }}
            className="text-violet-500 text-sm font-bold"
          >
            + 添加孩子
          </button>
        </div>

        {/* 家长 */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-50">
          <span className="text-2xl">{profile?.avatar_emoji}</span>
          <div className="flex-1">
            <p className="font-bold text-slate-700">{profile?.display_name}</p>
            <p className="text-xs text-slate-400">家长</p>
          </div>
        </div>

        {/* 孩子列表 */}
        {children.map(child => (
          <div key={child.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
            <span className="text-2xl">{child.avatar_emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-slate-700">{child.display_name}</p>
              <p className="text-xs text-slate-400">孩子</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-slate-400 space-y-0.5">
                <p>⭐ {child.stars}</p>
                <p>🌟 {child.magic_stars}</p>
                <p>🪙 {child.gold_beans}</p>
              </div>
              <button
                onClick={() => { setPinTarget(child); setPinSuccessId(null) }}
                className="text-xs font-bold text-violet-500 bg-violet-50 rounded-xl px-2 py-1 whitespace-nowrap"
              >
                {pinSuccessId === child.id ? '✅ PIN 已设' : '设置 PIN'}
              </button>
            </div>
          </div>
        ))}

        {children.length === 0 && !showAddChild && (
          <p className="text-sm text-slate-400 text-center py-4">暂无孩子账号</p>
        )}
      </div>

      {/* 添加孩子账号表单 */}
      {showAddChild && (
        <div className="bg-white rounded-[20px] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-500">添加孩子账号</h2>

          <div>
            <label className="text-xs text-slate-400 font-bold">昵称 *</label>
            <input
              value={childForm.display_name}
              onChange={e => setChildForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="如：Darren"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold">头像</label>
            <div className="mt-1 grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setChildForm(f => ({ ...f, avatar_emoji: emoji }))}
                  className={`text-2xl p-1 rounded-xl transition-all ${
                    childForm.avatar_emoji === emoji
                      ? 'bg-violet-100 scale-110 ring-2 ring-violet-400'
                      : 'bg-gray-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold">邮箱 *</label>
            <input
              value={childForm.email}
              onChange={e => setChildForm(f => ({ ...f, email: e.target.value }))}
              type="email"
              placeholder="child@example.com"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold">初始密码 *</label>
            <input
              value={childForm.password}
              onChange={e => setChildForm(f => ({ ...f, password: e.target.value }))}
              type="password"
              placeholder="至少 6 位"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
              minLength={6}
            />
          </div>

          {addError && (
            <p className="text-red-500 text-sm font-bold">{addError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddChild}
              disabled={addLoading}
              className="flex-1 bg-violet-500 text-white font-bold rounded-2xl py-3 text-sm disabled:opacity-50"
            >
              {addLoading ? '创建中…' : '创建账号'}
            </button>
            <button
              onClick={() => { setShowAddChild(false); setAddError('') }}
              className="flex-1 bg-gray-100 text-gray-500 font-bold rounded-2xl py-3 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 退出登录 */}
      <button
        onClick={handleSignOut}
        className="w-full bg-gray-100 text-gray-500 font-bold rounded-2xl py-3 text-sm"
      >
        退出登录
      </button>

      {pinTarget && (
        <PinSetSheet
          childId={pinTarget.id}
          childName={pinTarget.display_name}
          childEmoji={pinTarget.avatar_emoji}
          onClose={() => setPinTarget(null)}
          onSuccess={() => {
            setPinSuccessId(pinTarget.id)
            setPinTarget(null)
          }}
        />
      )}
    </div>
  )
}
