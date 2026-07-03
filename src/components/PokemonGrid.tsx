import type { GridEntry } from "../types"
import { PokemonCard } from "./PokemonCard"

type Props = {
  entries: GridEntry[]
  onCycle: (pokemonId: number) => void
  onLocation: (pokemonId: number) => void
}

export function PokemonGrid({ entries, onCycle, onLocation }: Props) {
  if (entries.length === 0) {
    return <div className="py-10 text-center text-white/40">No Pokémon match your filters.</div>
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
      {entries.map((e) => (
        <PokemonCard
          key={e.pokemon.id}
          pokemon={e.pokemon}
          regionalNumber={e.regionalNumber}
          status={e.status}
          onCycle={() => onCycle(e.pokemon.id)}
          onLocation={() => onLocation(e.pokemon.id)}
        />
      ))}
    </div>
  )
}
