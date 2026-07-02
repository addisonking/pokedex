import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "../lib/auth"

export function Login() {
  const { signUp, signIn, signInAnonymously } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setBusy(true)
    const fn = mode === "signup" ? signUp : signIn
    const { error } = await fn(email, password)
    setBusy(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(mode === "signup" ? "Account created!" : "Signed in!")
    navigate("/")
  }

  async function handleGuest() {
    setBusy(true)
    const { error } = await signInAnonymously()
    setBusy(false)
    if (error) {
      toast.error(error)
      return
    }
    navigate("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold">
          <img src="/pokeball.svg" alt="" className="h-7 w-7" />
          Pokédex Tracker
        </h1>

        <div className="mb-4 flex overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 text-sm font-medium transition ${
              mode === "signin" ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {busy ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-white/30">
          <div className="h-px flex-1 bg-white/10" />
          or
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          disabled={busy}
          className="w-full rounded border border-white/10 bg-white/5 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          Continue as guest
        </button>
      </div>
    </div>
  )
}
