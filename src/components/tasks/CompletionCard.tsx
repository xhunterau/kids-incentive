import { useState } from 'react'
import type { PendingCompletion } from '../../hooks/useCompletions'

interface CompletionCardProps {
  completion: PendingCompletion
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}

export function CompletionCard({ completion, onApprove, onReject }: CompletionCardProps) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleApprove = async () => {
    setProcessing(true)
    await onApprove(completion.id)
    setProcessing(false)
  }

  const handleReject = async () => {
    setProcessing(true)
    await onReject(completion.id, reason)
    setProcessing(false)
    setRejecting(false)
    setReason('')
  }

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm">
      {/* Child + time */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{completion.child.avatar_emoji}</span>
        <span className="font-black text-gray-700">{completion.child.display_name}</span>
        <span className="text-gray-200">·</span>
        <span className="text-xs text-gray-400">
          {new Date(completion.created_at).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Task summary */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 mb-3">
        <span className="text-2xl">{completion.task.emoji}</span>
        <div>
          <p className="font-bold text-gray-800 text-sm">{completion.task.title}</p>
          <div className="flex gap-2 mt-0.5">
            {completion.task.stars_reward > 0 && (
              <span className="text-xs text-amber-600 font-bold">⭐ +{completion.task.stars_reward}</span>
            )}
            {completion.task.magic_stars_reward > 0 && (
              <span className="text-xs text-violet-600 font-bold">🌟 +{completion.task.magic_stars_reward}</span>
            )}
          </div>
        </div>
      </div>

      {/* Child note */}
      {completion.note && (
        <p className="text-sm text-gray-500 italic mb-3">「{completion.note}」</p>
      )}

      {/* Reject reason input */}
      {rejecting && (
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="拒绝原因（可选）"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-red-300"
        />
      )}

      {!rejecting ? (
        <div className="flex gap-2">
          <button
            onClick={() => setRejecting(true)}
            className="flex-1 py-3 rounded-2xl bg-red-50 text-red-500 font-bold text-sm"
          >
            拒绝
          </button>
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex-[2] py-3 rounded-2xl bg-green-500 text-white font-black text-sm disabled:opacity-60"
          >
            {processing ? '处理中…' : '✓ 通过'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => { setRejecting(false); setReason('') }}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm"
          >
            取消
          </button>
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex-[2] py-3 rounded-2xl bg-red-500 text-white font-black text-sm disabled:opacity-60"
          >
            {processing ? '处理中…' : '确认拒绝'}
          </button>
        </div>
      )}
    </div>
  )
}
