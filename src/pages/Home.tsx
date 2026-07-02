import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AddGameModal } from "../components/AddGameModal"
import { GameCard } from "../components/GameCard"
import { Settings } from "../components/Settings"
import { VERSION_LABELS } from "../data"
import { importSave } from "../lib/save-parser"
import { useProgress } from "../lib/storage"

export function Home() {
  const navigate = useNavigate()
  const { playthroughs, addPlaythrough, bulkSet, completeSetup } = useProgress()
  const [adding, setAdding] = useState(false)
  const saveRef = useRef<HTMLInputElement>(null)

  function handleSaveImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const result = importSave(reader.result as ArrayBuffer)
      if (!result) {
        toast.error(
          "Couldn't read this save. Supported: R/B/Y, G/S/C, RSE, FRLG, DPPt, HGSS, BW, B2W2",
        )
        return
      }
      const label = VERSION_LABELS[result.version] ?? result.name
      const id = addPlaythrough(result.gameId, result.version, label)
      bulkSet(id, result.seen, 1)
      bulkSet(id, result.caught, 2)
      completeSetup(id)
      toast.success(
        `Imported ${result.caught.length} caught, ${result.seen.length} seen from ${file.name}`,
      )
      navigate(`/playthrough/${id}`)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <img src="/pokeball.svg" alt="" className="h-7 w-7" />
            Pokédex Tracker
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Track regional &amp; national dex progress — gens 1–5. Add a game, mark what you've seen
            &amp; caught.
          </p>
        </div>
        <Settings />
      </header>

      <h2 className="mb-3 text-xs uppercase tracking-wide text-white/40">Your games</h2>
      {playthroughs.length === 0 ? (
        <div className="mb-8 rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
          <p className="text-sm text-white/50">
            No playthroughs yet. Add a game or import a .sav file to start tracking.
          </p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playthroughs.map((p) => (
            <GameCard key={p.id} playthrough={p} />
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/40 transition hover:border-white/30 hover:bg-white/10 hover:text-white/70"
          >
            + Add a game
          </button>
        </div>
      )}

      {playthroughs.length === 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            + Add a game
          </button>
          <button
            type="button"
            onClick={() => saveRef.current?.click()}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            Import .sav
          </button>
        </div>
      )}

      {playthroughs.length > 0 && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => saveRef.current?.click()}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            Import .sav
          </button>
        </div>
      )}

      <input
        ref={saveRef}
        type="file"
        accept=".sav,application/octet-stream"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleSaveImport(f)
          e.target.value = ""
        }}
      />

      <footer className="mt-10 text-center text-xs text-white/30">
        Data from PokeAPI. Per-Pokémon details on Serebii. Progress stored locally in your browser.
      </footer>

      {adding && <AddGameModal onClose={() => setAdding(false)} />}
    </div>
  )
}
