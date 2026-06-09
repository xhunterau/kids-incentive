import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useChildTasks, type TaskWithStatus, type MilestoneCompletion } from '../../hooks/useTasks'
import { useSubmitCompletion } from '../../hooks/useCompletions'
import { TaskCard } from '../../components/tasks/TaskCard'
import { MilestoneCompletionCard } from '../../components/tasks/MilestoneCompletionCard'
import { BottomSheet } from '../../components/ui/BottomSheet'

type ActiveTab = 'todo' | 'pending' | 'done'
type DoneFilter = '1m' | '3m' | '1y' | 'older'

const PAGE_SIZE = 10

export default function ChildTasksPage() {
  const { profile } = useAuth()
  const { tasks, milestoneCompletions, loading, refetch } = useChildTasks(profile!.id)
  const { submit } = useSubmitCompletion()

  const [activeTab, setActiveTab] = useState<ActiveTab>('todo')
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null)
  const [note, setNote] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [doneFilter, setDoneFilter] = useState<DoneFilter>('1m')
  const [olderPage, setOlderPage] = useState(0)

  const todoTasks    = tasks.filter(t => t.displayStatus === 'todo')
  const pendingTasks = tasks.filter(t => t.displayStatus === 'pending')
  const allDoneTasks = tasks.filter(t => t.displayStatus === 'done')

  const pendingMilestones = milestoneCompletions.filter(m => m.completion.status === 'pending')
  const allDoneMilestones = milestoneCompletions.filter(m => m.completion.status === 'approved')

  const now = Date.now()
  const cutoffs: Record<DoneFilter, number> = {
    '1m':    now - 30  * 24 * 60 * 60 * 1000,
    '3m':    now - 90  * 24 * 60 * 60 * 1000,
    '1y':    now - 365 * 24 * 60 * 60 * 1000,
    'older': 0,
  }

  const filterByTime = (ts: number) =>
    doneFilter === 'older' ? ts < cutoffs['1y'] : ts >= cutoffs[doneFilter]

  const filteredDoneTasks = allDoneTasks.filter(t =>
    filterByTime(new Date(t.completion!.created_at).getTime())
  )
  const filteredDoneMilestones = allDoneMilestones.filter(m =>
    filterByTime(new Date(m.completion.created_at).getTime())
  )

  // Interleave done tasks and milestone completions sorted by date desc
  type DoneItem =
    | { kind: 'task'; data: TaskWithStatus }
    | { kind: 'milestone'; data: MilestoneCompletion }

  const allDoneItems: DoneItem[] = [
    ...filteredDoneTasks.map(t => ({ kind: 'task' as const, data: t, ts: new Date(t.completion!.created_at).getTime() })),
    ...filteredDoneMilestones.map(m => ({ kind: 'milestone' as const, data: m, ts: new Date(m.completion.created_at).getTime() })),
  ].sort((a, b) => b.ts - a.ts)

  const olderTotalPages = Math.ceil(allDoneItems.length / PAGE_SIZE)
  const pagedDoneItems = doneFilter === 'older'
    ? allDoneItems.slice(olderPage * PAGE_SIZE, (olderPage + 1) * PAGE_SIZE)
    : allDoneItems

  const handleDoneFilterChange = (f: DoneFilter) => {
    setDoneFilter(f)
    setOlderPage(0)
  }

  const handleClose = () => {
    setSelectedTask(null)
    setNote('')
    setQuantity(1)
    setSubmitError(null)
  }

  const handleSubmit = async () => {
    if (!selectedTask || !profile) return
    setSubmitting(true)
    setSubmitError(null)
    const isMilestone = selectedTask.recurrence === 'milestone'
    const opts = isMilestone && quantity > 1 ? {
      starsReward: selectedTask.stars_reward > 0 ? selectedTask.stars_reward * quantity : null,
      magicStarsReward: selectedTask.magic_stars_reward > 0 ? selectedTask.magic_stars_reward * quantity : null,
    } : {}
    const { error } = await submit(selectedTask.id, profile.id, note, opts)
    if (error) {
      setSubmitting(false)
      setSubmitError(error.message)
      return
    }
    setSubmitting(false)
    handleClose()
    refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 font-bold">加载中…</p>
      </div>
    )
  }

  const totalPending = pendingTasks.length + pendingMilestones.length
  const totalDone    = allDoneTasks.length + allDoneMilestones.length

  const tabs: { key: ActiveTab; label: string; count: number; active: string; inactive: string }[] = [
    {
      key: 'todo',
      label: '待完成',
      count: todoTasks.length,
      active: 'bg-violet-600 text-white',
      inactive: 'bg-white text-violet-600 border border-violet-200',
    },
    {
      key: 'pending',
      label: '审批中',
      count: totalPending,
      active: 'bg-amber-500 text-white',
      inactive: 'bg-white text-amber-600 border border-amber-200',
    },
    {
      key: 'done',
      label: '已完成',
      count: totalDone,
      active: 'bg-green-600 text-white',
      inactive: 'bg-white text-green-600 border border-green-200',
    },
  ]

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Tab bar */}
      <div className="flex gap-2 mb-5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-2xl font-black text-sm transition-colors ${
              activeTab === tab.key ? tab.active : tab.inactive
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 text-xs font-bold ${activeTab === tab.key ? 'opacity-80' : 'opacity-60'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 待完成 */}
      {activeTab === 'todo' && (
        <div className="space-y-3">
          {todoTasks.length === 0
            ? <EmptyState text="暂无待完成任务 🎉" />
            : todoTasks.map(task => (
                <TaskCard key={task.id} task={task} onSubmit={setSelectedTask} />
              ))
          }
        </div>
      )}

      {/* 审批中 */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {totalPending === 0
            ? <EmptyState text="暂无审批中的任务" />
            : <>
                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} onSubmit={setSelectedTask} />
                ))}
                {pendingMilestones.map(m => (
                  <MilestoneCompletionCard key={m.completion.id} item={m} />
                ))}
              </>
          }
        </div>
      )}

      {/* 已完成 */}
      {activeTab === 'done' && (
        <div>
          {/* Time filter */}
          <div className="flex gap-1.5 mb-4">
            {(['1m', '3m', '1y', 'older'] as DoneFilter[]).map(f => (
              <button
                key={f}
                onClick={() => handleDoneFilterChange(f)}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                  doneFilter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {f === '1m' ? '近1月' : f === '3m' ? '近3月' : f === '1y' ? '近1年' : '更早'}
              </button>
            ))}
          </div>

          {allDoneItems.length === 0
            ? <EmptyState text="该时间段内暂无完成记录" />
            : (
              <div className="space-y-3">
                {pagedDoneItems.map(item =>
                  item.kind === 'task'
                    ? <TaskCard key={item.data.id} task={item.data} onSubmit={setSelectedTask} />
                    : <MilestoneCompletionCard key={(item.data as MilestoneCompletion).completion.id} item={item.data as MilestoneCompletion} />
                )}
              </div>
            )
          }

          {doneFilter === 'older' && olderTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setOlderPage(p => p - 1)}
                disabled={olderPage === 0}
                className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm disabled:opacity-30"
              >
                ← 上一页
              </button>
              <span className="text-xs text-gray-400 font-bold">
                {olderPage + 1} / {olderTotalPages}
              </span>
              <button
                onClick={() => setOlderPage(p => p + 1)}
                disabled={olderPage >= olderTotalPages - 1}
                className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm disabled:opacity-30"
              >
                下一页 →
              </button>
            </div>
          )}
        </div>
      )}

      <BottomSheet open={!!selectedTask} onClose={handleClose} title="提交完成申请">
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-violet-50 rounded-2xl p-4">
              <span className="text-3xl leading-none">{selectedTask.emoji}</span>
              <div>
                <p className="font-black text-gray-800">{selectedTask.title}</p>
                <div className="flex gap-2 mt-1">
                  {selectedTask.stars_reward > 0 && (
                    <span className="text-xs font-bold text-amber-600">
                      ⭐ +{selectedTask.recurrence === 'milestone' && quantity > 1
                        ? selectedTask.stars_reward * quantity
                        : selectedTask.stars_reward}
                      {selectedTask.recurrence === 'milestone' && quantity > 1 && (
                        <span className="text-amber-400"> ({selectedTask.stars_reward}×{quantity})</span>
                      )}
                    </span>
                  )}
                  {selectedTask.magic_stars_reward > 0 && (
                    <span className="text-xs font-bold text-violet-600">
                      🌟 +{selectedTask.recurrence === 'milestone' && quantity > 1
                        ? selectedTask.magic_stars_reward * quantity
                        : selectedTask.magic_stars_reward}
                      {selectedTask.recurrence === 'milestone' && quantity > 1 && (
                        <span className="text-violet-400"> ({selectedTask.magic_stars_reward}×{quantity})</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedTask.recurrence === 'milestone' && (
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">场次数量</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 font-black text-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-black text-2xl text-gray-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(20, q + 1))}
                    className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 font-black text-lg flex items-center justify-center active:scale-95 transition-transform"
                  >
                    ＋
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                备注（可选）
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="告诉爸爸妈妈你完成了什么…"
                rows={3}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-400"
              />
            </div>

            {submitError && (
              <p className="text-red-500 text-sm font-bold">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-violet-600 text-white font-black text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-60"
            >
              {submitting ? '提交中…' : '提交申请 →'}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-gray-400 py-12 text-sm font-bold">{text}</p>
}
