import { Link } from "react-router-dom"
import { GAMES_BY_ID, GEN_CAP, VERSION_LABELS } from "../data"
import { countCaught } from "../lib/progress"
import { useProgress } from "../lib/storage"
import type { Playthrough } from "../types"
import { ProgressBar } from "./ProgressBar"

type Props = {
  playthrough: Playthrough
}

export function GameCard({ playthrough }: Props) {
  const { progress } = useProgress()
  const game = GAMES_BY_ID.get(playthrough.gameId)
  const state = progress[playthrough.id]

  if (!game) return null

  const regionalTotal = game.dex.length
  const nationalTotal = GEN_CAP[game.gen]
  const regionalIds = game.dex.map((d) => d.n)
  const nationalIds = Array.from({ length: nationalTotal }, (_, i) => i + 1)
  const regionalCaught = countCaught(state, regionalIds)
  const nationalCaught = countCaught(state, nationalIds)
  const collapse = regionalTotal === nationalTotal

  return (
    <Link
      to={`/playthrough/${playthrough.id}`}
      className="group relative block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/25 hover:bg-white/10"
    >
      <div className="mb-3">
        <div className="text-[11px] uppercase tracking-wide text-white/40">
          {VERSION_LABELS[playthrough.version]} · Gen {game.gen}
        </div>
        <div className="mt-0.5 font-semibold">{playthrough.name}</div>
        <div className="text-xs text-white/50">{game.description}</div>
      </div>
      {collapse ? (
        <ProgressBar caught={regionalCaught} total={regionalTotal} />
      ) : (
        <div className="space-y-2">
          <div>
            <div className="mb-0.5 text-[11px] uppercase tracking-wide text-white/40">Regional</div>
            <ProgressBar caught={regionalCaught} total={regionalTotal} />
          </div>
          <div>
            <div className="mb-0.5 text-[11px] uppercase tracking-wide text-white/40">National</div>
            <ProgressBar caught={nationalCaught} total={nationalTotal} />
          </div>
        </div>
      )}
    </Link>
  )
}
