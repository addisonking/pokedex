import { Toaster } from "@/components/ui/sonner"
import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./lib/auth"
import { ProgressProvider } from "./lib/storage"
import { Home } from "./pages/Home"
import { Login } from "./pages/Login"
import { PlaythroughTracker } from "./pages/PlaythroughTracker"

function ProtectedRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/40">Loading...</div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <ProgressProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playthrough/:id" element={<PlaythroughTracker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </ProgressProvider>
  )
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
