import type { Game, Pokemon } from "../types"
import gamesRaw from "./games.json"
import pokemonRaw from "./pokemon.json"

export const POKEMON: Pokemon[] = pokemonRaw as Pokemon[]
export const GAMES: Game[] = gamesRaw as Game[]
export const POKEMON_BY_ID: Map<number, Pokemon> = new Map(POKEMON.map((p) => [p.id, p]))
export const NATIONAL_IDS: number[] = POKEMON.map((p) => p.id)

export const GAMES_BY_ID: Map<string, Game> = new Map(GAMES.map((g) => [g.id, g]))

export const GEN_CAP: Record<number, number> = { 1: 151, 2: 251, 3: 386, 4: 493, 5: 649 }

export const VERSION_LABELS: Record<string, string> = {
  red: "Red",
  blue: "Blue",
  yellow: "Yellow",
  gold: "Gold",
  silver: "Silver",
  crystal: "Crystal",
  ruby: "Ruby",
  sapphire: "Sapphire",
  emerald: "Emerald",
  firered: "FireRed",
  leafgreen: "LeafGreen",
  diamond: "Diamond",
  pearl: "Pearl",
  platinum: "Platinum",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Black",
  white: "White",
  "black-2": "Black 2",
  "white-2": "White 2",
}
