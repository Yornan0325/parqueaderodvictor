import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./firebase/firebase"
import Layout from "./components/layout/layout"
import { useNetworkStatus } from "./hooks/use-network-status"
import { useUserProfile } from "./hooks/use-user-profile"
import { Loader2 } from "lucide-react"
import { RoleGuard } from "./components/auth/role-guard"

import DashboardView from "./pages/DashboardView"
import UsersView from "./pages/UsersView"
import SubscribersView from "./pages/SubscribersView"
import EntryView from "./pages/EntryView"
import LoginPage from "./pages/sesion/LoginPage"
import RegisterPage from "./pages/sesion/RegisterPage"
import HistoryView from "./pages/HistoryView"
import ConfigurationView from "./pages/ConfigurationView"

function App() {
  useNetworkStatus()
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: profile, isLoading: profileLoading } = useUserProfile(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <Layout profile={profile}>
      <Routes>
        <Route path="/" element={<DashboardView user={user} />} />
        <Route
          path="/usuarios"
          element={
            <RoleGuard profile={profile} allowedRoles={['admin']}>
              <UsersView />
            </RoleGuard>
          }
        />
        <Route
          path="/suscripciones"
          element={
            <RoleGuard profile={profile} allowedRoles={['admin']}>
              <SubscribersView user={user} />
            </RoleGuard>
          }
        />
        <Route
          path="/registro"
          element={
            <RoleGuard profile={profile} allowedRoles={['admin', 'employee']}>
              <EntryView user={user} onComplete={() => {}} />
            </RoleGuard>
          }
        />
        <Route path="/historial" element={<HistoryView user={user} />} />
        <Route
          path="/configuracion"
          element={
            <RoleGuard profile={profile} allowedRoles={['admin']}>
              <ConfigurationView />
            </RoleGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
