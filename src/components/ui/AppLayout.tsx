import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { WalletBar } from '../layout/WalletBar'
import { ParentTopBar } from '../layout/ParentTopBar'
import { useAuth } from '../../hooks/useAuth'

export function AppLayout() {
  const { profile } = useAuth()

  if (!profile) return null

  return (
    <div
      className="min-h-screen max-w-lg mx-auto relative"
      style={{ background: profile.role === 'child' ? '#F0F4FF' : '#F8FAFC' }}
    >
      {profile.role === 'child' ? <WalletBar /> : <ParentTopBar />}
      <main className="pt-14 pb-20 min-h-screen">
        <Outlet />
      </main>
      <BottomNav role={profile.role} />
    </div>
  )
}
