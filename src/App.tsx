import { Toaster } from "@/components/ui/sonner"
import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { ProgressProvider } from "./lib/storage"
import { Home } from "./pages/Home"
import { PlaythroughTracker } from "./pages/PlaythroughTracker"

export function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playthrough/:id" element={<PlaythroughTracker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster />
    </ProgressProvider>
  )
}
