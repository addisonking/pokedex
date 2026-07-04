import type { DexData } from "./gen1"

// gen 5: BW/B2W2 — plaintext blocks, CRC16-CCITT checksums
// save: 512KB (0x80000) = two copies (A@0x0, B@0x40000)
// BW: main 0x24000, pokedex block at 0x21600, checksum info 0x8C
// B2W2: main 0x26000, pokedex block at 0x21400, checksum info 0x94
// Zukan5: u32 magic(0xbeefcafe), u32 packed, caught@0x08 (0x54 bytes), seen@0x5C (4×0x54 bytes)
// bits LSB-first, max 649

const COPY_SIZE = 0x40000
// PlayerData block (0x19400 in both BW and B2W2) stores a game-version byte at 0x1F
const VERSION_OFFSET = 0x19400 + 0x1f
const VERSIONS: Record<number, string> = {
  20: "white",
  21: "black",
  22: "white-2",
  23: "black-2",
}
const MAX_ID = 649
const BIT_REGION = 0x54

type Gen5Config = {
  mainSize: number
  infoLen: number
  dexOffset: number
  gameId: string
  defaultVersion: string
}

const BW: Gen5Config = {
  mainSize: 0x24000,
  infoLen: 0x8c,
  dexOffset: 0x21600,
  gameId: "bw",
  defaultVersion: "white",
}
const B2W2: Gen5Config = {
  mainSize: 0x26000,
  infoLen: 0x94,
  dexOffset: 0x21400,
  gameId: "b2w2",
  defaultVersion: "black-2",
}

function crc16CCITT(data: Uint8Array, start: number, end: number): number {
  let top = 0xff
  let bot = 0xff
  for (let i = start; i < end; i++) {
    let x = data[i] ^ top
    x ^= x >> 4
    top = (bot ^ (x >> 3) ^ ((x << 4) & 0xff)) & 0xff
    bot = (x ^ ((x << 5) & 0xff)) & 0xff
  }
  return (top << 8) | bot
}

function validateFooter(buf: Uint8Array, cfg: Gen5Config, copyBase: number): boolean {
  const footerStart = copyBase + cfg.mainSize - 0x100
  const stored =
    buf[footerStart + cfg.infoLen + 0x0e] | (buf[footerStart + cfg.infoLen + 0x0f] << 8)
  const computed = crc16CCITT(buf, footerStart, footerStart + cfg.infoLen)
  return stored === computed
}

function readBits(buf: Uint8Array, offset: number): number[] {
  const ids: number[] = []
  for (let byte = 0; byte < BIT_REGION; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const id = byte * 8 + bit + 1
      if (id > MAX_ID) return ids
      if (buf[offset + byte] & (1 << bit)) ids.push(id)
    }
  }
  return ids
}

function readSeen(buf: Uint8Array, base: number): number[] {
  const seenOff = base + 0x5c
  const ids: number[] = []
  for (let byte = 0; byte < BIT_REGION; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const id = byte * 8 + bit + 1
      if (id > MAX_ID) return ids
      for (let r = 0; r < 4; r++) {
        if (buf[seenOff + r * BIT_REGION + byte] & (1 << bit)) {
          ids.push(id)
          break
        }
      }
    }
  }
  return ids
}

export function parseGen5(buf: Uint8Array): (DexData & { version: string }) | null {
  if (buf.length < 0x80000) return null

  // detect BW vs B2W2 by validating footer
  let cfg: Gen5Config | null = null
  let copyBase = 0

  for (const c of [BW, B2W2]) {
    for (const base of [0, COPY_SIZE]) {
      if (validateFooter(buf, c, base)) {
        cfg = c
        copyBase = base
        break
      }
    }
    if (cfg) break
  }
  if (!cfg) return null

  const dexOff = copyBase + cfg.dexOffset
  const magic =
    (buf[dexOff] | (buf[dexOff + 1] << 8) | (buf[dexOff + 2] << 16) | (buf[dexOff + 3] << 24)) >>> 0
  if (magic !== 0xbeefcafe) return null

  return {
    caught: readBits(buf, dexOff + 0x08),
    seen: readSeen(buf, dexOff),
    version: VERSIONS[buf[copyBase + VERSION_OFFSET]] ?? cfg.defaultVersion,
  }
}

export function detectGen5GameId(version: string): string {
  return version === "black-2" || version === "white-2" ? "b2w2" : "bw"
}
