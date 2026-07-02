import type { Game } from "../types"

const VERSION_ANCHOR: Record<string, string> = {
  red: "r",
  blue: "b",
  yellow: "y",
  gold: "g",
  silver: "s",
  crystal: "c",
  ruby: "ruby",
  sapphire: "sapphire",
  emerald: "emerald",
  firered: "firered",
  leafgreen: "leafgreen",
  diamond: "diamond",
  pearl: "pearl",
  platinum: "platinum",
  heartgold: "hg",
  soulsilver: "ss",
  black: "black",
  white: "white",
  "black-2": "black2",
  "white-2": "white2",
}

export function serebiiLocationUrl(game: Game, nationalId: number, version: string): string {
  const num = String(nationalId).padStart(3, "0")
  const base = game.serebiiSuffix ? `pokedex-${game.serebiiSuffix}` : "pokedex"
  const anchor = VERSION_ANCHOR[version] ?? "general"
  return `https://www.serebii.net/${base}/location/${num}.shtml#${anchor}`
}
