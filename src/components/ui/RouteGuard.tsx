import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface Props {
  children: React.ReactNode
  role?: UserRole
}

export function RouteGuard({ children, role }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-50">
        <div className="text-5xl animate-bounce">⭐</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'parent' ? '/parent/dashboard' : '/child/tasks'} replace />
  }

  return <>{children}</>
}
