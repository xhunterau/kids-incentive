import { useAuth } from '../../hooks/useAuth'
import { usePendingCompletions } from '../../hooks/useCompletions'
import { CompletionCard } from '../../components/tasks/CompletionCard'

export default function ApprovalsPage() {
  const { profile } = useAuth()
  const { completions, loading, approve, reject } = usePendingCompletions(profile!.family_id!)

  const handleApprove = async (id: string) => { await approve(id, profile!.id) }
  const handleReject = async (id: string, reason: string) => { await reject(id, profile!.id, reason) }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 font-bold">加载中…</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      {completions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">✅</p>
          <p className="font-black text-gray-600">暂无待审批任务</p>
          <p className="text-sm mt-1">孩子们都很努力！</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 font-bold mb-3">
            {completions.length} 条待审批
          </p>
          <div className="space-y-3">
            {completions.map(c => (
              <CompletionCard
                key={c.id}
                completion={c}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
