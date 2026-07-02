import { useRef, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "../lib/auth"
import { useProgress } from "../lib/storage"
import type { Store } from "../types"

export function Settings() {
  const { exportJson, importJson, reset, addPlaythrough, bulkSet, completeSetup } = useProgress()
  const { isAnonymous, signOut, upgradeAnon } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState("")
  const [upgradePass, setUpgradePass] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(null), 2500)
  }

  function doExport() {
    const blob = new Blob([exportJson()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pokedex-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
    flash("Exported backup.")
  }

  function doImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importJson(String(reader.result))
      flash(ok ? "Imported progress." : "Invalid file.")
    }
    reader.readAsText(file)
    setOpen(false)
  }

  function migrateFromLocalStorage() {
    try {
      const raw = localStorage.getItem("pokedex")
      if (!raw) {
        flash("No local data found.")
        return
      }
      const parsed = JSON.parse(raw) as Store
      if (!parsed.playthroughs || !parsed.progress) {
        flash("Invalid local data.")
        return
      }
      for (const pt of parsed.playthroughs) {
        const newId = addPlaythrough(pt.gameId, pt.version, pt.name)
        const state = parsed.progress[pt.id]
        if (state) {
          const seen: number[] = []
          const caught: number[] = []
          for (const [pid, rec] of Object.entries(state)) {
            if (rec.s === 1) seen.push(Number(pid))
            if (rec.s === 2) caught.push(Number(pid))
          }
          if (seen.length > 0) bulkSet(newId, seen, 1)
          if (caught.length > 0) bulkSet(newId, caught, 2)
        }
        completeSetup(newId)
      }
      localStorage.removeItem("pokedex")
      flash(`Migrated ${parsed.playthroughs.length} playthroughs.`)
      setOpen(false)
    } catch {
      flash("Migration failed.")
    }
  }

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await upgradeAnon(upgradeEmail, upgradePass)
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Account upgraded!")
    setShowUpgrade(false)
    setUpgradeEmail("")
    setUpgradePass("")
  }

  const hasLocalData =
    typeof localStorage !== "undefined" && localStorage.getItem("pokedex") !== null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          setConfirmReset(false)
        }}
        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
      >
        Settings
      </button>
      {msg && <span className="absolute right-0 top-9 text-xs text-emerald-400">{msg}</span>}
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded border border-white/10 bg-[#16191f] p-2 shadow-xl">
          {isAnonymous && (
            <>
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="block w-full rounded bg-sky-600/80 px-3 py-1.5 text-left text-sm text-white hover:bg-sky-600"
              >
                Upgrade guest account
              </button>
              <div className="my-1 border-t border-white/10" />
            </>
          )}
          <button
            type="button"
            onClick={doExport}
            className="block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-white/10"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-white/10"
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) doImport(f)
              e.target.value = ""
            }}
          />
          {hasLocalData && (
            <>
              <div className="my-1 border-t border-white/10" />
              <button
                type="button"
                onClick={migrateFromLocalStorage}
                className="block w-full rounded px-3 py-1.5 text-left text-sm text-amber-400 hover:bg-white/10"
              >
                Migrate from localStorage
              </button>
            </>
          )}
          <div className="my-1 border-t border-white/10" />
          {confirmReset ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <span className="text-xs text-white/60">Sure?</span>
              <button
                type="button"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                  setOpen(false)
                  flash("Everything reset.")
                }}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="block w-full rounded px-3 py-1.5 text-left text-sm text-red-400 hover:bg-white/10"
            >
              Reset everything
            </button>
          )}
          <div className="my-1 border-t border-white/10" />
          <button
            type="button"
            onClick={() => {
              signOut()
              setOpen(false)
            }}
            className="block w-full rounded px-3 py-1.5 text-left text-sm text-white/70 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
      {showUpgrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowUpgrade(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowUpgrade(false)
          }}
          tabIndex={-1}
        >
          <form
            onSubmit={handleUpgrade}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-3 rounded-lg border border-white/10 bg-[#16191f] p-6"
          >
            <h2 className="text-lg font-bold">Upgrade guest account</h2>
            <p className="text-sm text-white/50">
              Add email + password to keep your data permanently.
            </p>
            <input
              type="email"
              value={upgradeEmail}
              onChange={(e) => setUpgradeEmail(e.target.value)}
              placeholder="email"
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
            />
            <input
              type="password"
              value={upgradePass}
              onChange={(e) => setUpgradePass(e.target.value)}
              placeholder="password"
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
            />
            <button
              type="submit"
              className="w-full rounded bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              Upgrade account
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
