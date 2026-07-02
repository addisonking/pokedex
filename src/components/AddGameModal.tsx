import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { GAMES, VERSION_LABELS } from "../data"
import { useProgress } from "../lib/storage"

type Props = {
  onClose: () => void
}

export function AddGameModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { addPlaythrough } = useProgress()
  const [selected, setSelected] = useState<string>("")
  const [name, setName] = useState("")
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    selectRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const version = selected ? (VERSION_LABELS[selected.split(":")[1]] ?? "") : ""

  function handleAdd() {
    if (!selected) return
    const [gameId, ver] = selected.split(":")
    const label = name.trim() || VERSION_LABELS[ver] || ver
    const id = addPlaythrough(gameId, ver, label)
    onClose()
    navigate(`/playthrough/${id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#16191f] p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add a game</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-0.5 text-white/50 hover:bg-white/10 hover:text-white/80"
          >
            ✕
          </button>
        </div>
        <label
          htmlFor="add-game-version"
          className="mb-1 block text-xs uppercase tracking-wide text-white/40"
        >
          Version
        </label>
        <select
          id="add-game-version"
          ref={selectRef}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value)
            setName("")
          }}
          className="mb-3 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
        >
          <option value="" disabled>
            Pick a game…
          </option>
          {GAMES.map((g) => (
            <optgroup key={g.id} label={`Gen ${g.gen} — ${g.name} (${g.description})`}>
              {g.versions.map((v) => (
                <option key={`${g.id}:${v}`} value={`${g.id}:${v}`}>
                  {VERSION_LABELS[v] ?? v}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <label
          htmlFor="add-game-name"
          className="mb-1 block text-xs uppercase tracking-wide text-white/40"
        >
          Name (optional)
        </label>
        <input
          id="add-game-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          placeholder={version || "e.g. Gold Nuzlocke"}
          className="mb-4 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected}
          className="w-full rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40"
        >
          Add playthrough
        </button>
      </div>
    </div>
  )
}
