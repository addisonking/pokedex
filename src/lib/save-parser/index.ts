import { detectGen1Version, parseGen1 } from "./gen1"
import { parseGen2 } from "./gen2"
import { parseGen3 } from "./gen3"
import { parseGen4 } from "./gen4"
import { parseGen5 } from "./gen5"

export type ImportResult = {
  gameId: string
  version: string
  name: string
  seen: number[]
  caught: number[]
}

const NAMES: Record<string, string> = {
  red: "Red",
  blue: "Red",
  yellow: "Yellow",
  gold: "Gold",
  crystal: "Crystal",
  ruby: "Ruby",
  sapphire: "Ruby",
  emerald: "Emerald",
  firered: "FireRed",
  leafgreen: "FireRed",
  diamond: "Diamond",
  pearl: "Diamond",
  platinum: "Platinum",
  heartgold: "HeartGold",
  soulsilver: "HeartGold",
  white: "White",
  black: "White",
  "black-2": "Black 2",
  "white-2": "White 2",
}

const GAME_IDS: Record<string, string> = {
  red: "rby",
  blue: "rby",
  yellow: "rby",
  gold: "gsc",
  crystal: "gsc",
  ruby: "rse",
  sapphire: "rse",
  emerald: "rse",
  firered: "frlg",
  leafgreen: "frlg",
  diamond: "dpp",
  pearl: "dpp",
  platinum: "dpp",
  heartgold: "hgss",
  soulsilver: "hgss",
  white: "bw",
  black: "bw",
  "black-2": "b2w2",
  "white-2": "b2w2",
}

export function importSave(buf: ArrayBuffer): ImportResult | null {
  const data = new Uint8Array(buf)
  const len = data.length

  // gen 1-2: ~32KB
  if (len >= 0x8000 && len <= 0x8100) {
    const gen1 = parseGen1(data)
    if (gen1) {
      const version = detectGen1Version(data)
      return {
        gameId: "rby",
        version,
        name: NAMES[version] ?? "Red",
        seen: gen1.seen,
        caught: gen1.caught,
      }
    }
    const gen2 = parseGen2(data)
    if (gen2) {
      return {
        gameId: "gsc",
        version: gen2.version,
        name: NAMES[gen2.version] ?? "Gold",
        seen: gen2.seen,
        caught: gen2.caught,
      }
    }
    return null
  }

  // gen 3: 128KB
  if (len === 0x20000) {
    const gen3 = parseGen3(data)
    if (gen3) {
      return {
        gameId: GAME_IDS[gen3.version] ?? "rse",
        version: gen3.version,
        name: NAMES[gen3.version] ?? "Ruby",
        seen: gen3.seen,
        caught: gen3.caught,
      }
    }
    return null
  }

  // gen 4-5: 512KB — try gen 4 magic first, then gen 5 footer
  if (len === 0x80000) {
    const gen4 = parseGen4(data)
    if (gen4) {
      return {
        gameId: GAME_IDS[gen4.version] ?? "dpp",
        version: gen4.version,
        name: NAMES[gen4.version] ?? "Platinum",
        seen: gen4.seen,
        caught: gen4.caught,
      }
    }
    const gen5 = parseGen5(data)
    if (gen5) {
      return {
        gameId: GAME_IDS[gen5.version] ?? "bw",
        version: gen5.version,
        name: NAMES[gen5.version] ?? "White",
        seen: gen5.seen,
        caught: gen5.caught,
      }
    }
    return null
  }

  return null
}
