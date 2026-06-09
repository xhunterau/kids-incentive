import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/parent/dashboard': '家庭看板',
  '/parent/tasks': '任务管理',
  '/parent/approvals': '审批中心',
  '/parent/beans': '金豆豆记录',
  '/parent/family': '家庭设置',
}

export function ParentTopBar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? '家长端'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14">
      <div className="max-w-lg mx-auto h-full flex items-center px-5">
        <h1 className="text-lg font-black text-slate-700">{title}</h1>
      </div>
    </header>
  )
}
