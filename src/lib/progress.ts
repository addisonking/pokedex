import type { TrackerState } from "../types"

export function countCaught(state: TrackerState | undefined, ids: number[]): number {
  if (!state) return 0
  let n = 0
  for (const id of ids) {
    if (state[id]?.s === 2) n++
  }
  return n
}

export function pct(caught: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((caught / total) * 100)
}
