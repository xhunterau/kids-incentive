import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit, useAuth } from './hooks/useAuth'
import { RouteGuard } from './components/ui/RouteGuard'
import { AppLayout } from './components/ui/AppLayout'

import LoginPage from './pages/auth/LoginPage'

import ChildTasksPage from './pages/child/TasksPage'
import ChildWalletPage from './pages/child/WalletPage'
import ChildShopPage from './pages/child/ShopPage'
import LeaderboardPage from './pages/child/LeaderboardPage'
import ProfilePage from './pages/child/ProfilePage'

import ParentDashboardPage from './pages/parent/DashboardPage'
import ParentTasksPage from './pages/parent/TasksPage'
import ApprovalsPage from './pages/parent/ApprovalsPage'
import BeansPage from './pages/parent/BeansPage'
import FamilyPage from './pages/parent/FamilyPage'

function RootRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'parent' ? '/parent/dashboard' : '/child/tasks'} replace />
}

import { useProfileRealtime } from './hooks/useProfile'

function AppInner() {
  useProfileRealtime()
  return null
}

export default function App() {
  useAuthInit()

  return (
    <BrowserRouter>
      <AppInner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        <Route element={<RouteGuard role="child"><AppLayout /></RouteGuard>}>
          <Route path="/child/tasks"       element={<ChildTasksPage />} />
          <Route path="/child/wallet"      element={<ChildWalletPage />} />
          <Route path="/child/shop"        element={<ChildShopPage />} />
          <Route path="/child/leaderboard" element={<LeaderboardPage />} />
          <Route path="/child/profile"     element={<ProfilePage />} />
        </Route>

        <Route element={<RouteGuard role="parent"><AppLayout /></RouteGuard>}>
          <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
          <Route path="/parent/tasks"     element={<ParentTasksPage />} />
          <Route path="/parent/approvals" element={<ApprovalsPage />} />
          <Route path="/parent/beans"     element={<BeansPage />} />
          <Route path="/parent/family"    element={<FamilyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
