import { Toaster } from "@/components/ui/sonner"
import { Route, Routes } from "react-router-dom"
import { ProgressProvider } from "./lib/storage"
import { Home } from "./pages/Home"
import { PlaythroughTracker } from "./pages/PlaythroughTracker"

export function App() {
  return (
    <ProgressProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playthrough/:id" element={<PlaythroughTracker />} />
      </Routes>
      <Toaster />
    </ProgressProvider>
  )
}
