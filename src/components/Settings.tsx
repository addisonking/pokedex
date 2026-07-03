import { useRef, useState } from "react"
import { useProgress } from "../lib/storage"

export function Settings() {
  const { exportJson, importJson, reset } = useProgress()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
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
        </div>
      )}
    </div>
  )
}
