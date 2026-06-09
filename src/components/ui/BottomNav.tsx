import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types'

const childTabs = [
  { to: '/child/tasks',       icon: '📋', label: '任务' },
  { to: '/child/wallet',      icon: '💰', label: '宝箱' },
  { to: '/child/shop',        icon: '🛒', label: '商店' },
  { to: '/child/leaderboard', icon: '🏆', label: '排行' },
  { to: '/child/profile',     icon: '👤', label: '我的' },
]

const parentTabs = [
  { to: '/parent/dashboard', icon: '📊', label: '看板' },
  { to: '/parent/tasks',     icon: '📋', label: '任务' },
  { to: '/parent/approvals', icon: '✅', label: '审批' },
  { to: '/parent/beans',     icon: '🪙', label: '金豆豆' },
  { to: '/parent/family',    icon: '👨‍👧‍👦', label: '家庭' },
]

export function BottomNav({ role }: { role: UserRole }) {
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
            <span className="text-2xl leading-none">{tab.icon}</span>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
