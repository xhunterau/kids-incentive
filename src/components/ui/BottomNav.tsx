import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types'

type BottomNavTab = {
  to: string
  icon: string
  label: string
  badge?: boolean
}

const childTabs: BottomNavTab[] = [
  { to: '/child/tasks',       icon: '📋', label: '任务' },
  { to: '/child/wallet',      icon: '💰', label: '宝箱' },
  { to: '/child/shop',        icon: '🛒', label: '商店' },
  { to: '/child/leaderboard', icon: '🏆', label: '排行' },
  { to: '/child/profile',     icon: '👤', label: '我的' },
]

const parentTabs: BottomNavTab[] = [
  { to: '/parent/dashboard', icon: '📊', label: '看板',   badge: false },
  { to: '/parent/tasks',     icon: '📋', label: '任务',   badge: false },
  { to: '/parent/approvals', icon: '✅', label: '审批',   badge: true  },
  { to: '/parent/beans',     icon: '🪙', label: '金豆豆', badge: false },
  { to: '/parent/family',    icon: '👨‍👩‍👧‍👦', label: '家庭',   badge: false },
]

export function BottomNav({ role, pendingCount = 0 }: { role: UserRole; pendingCount?: number }) {
  const tabs = role === 'parent' ? parentTabs : childTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-pb">
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`
            }
          >
            <div className="relative inline-flex">
              <span className="text-2xl leading-none">{tab.icon}</span>
              {'badge' in tab && tab.badge && pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
