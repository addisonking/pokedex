import type { DexData } from "./gen1"

// gen 3: RSE/FRLG — plaintext sections, no encryption
// save: 128KB (0x20000) = two save slots (A@0x0, B@0xE000), each 14 sectors of 0x1000
// each sector: 0xF80 data bytes + footer (section ID@0xFF4, checksum@0xFF6, signature@0xFF8, saveIndex@0xFFC)
// pick slot with higher saveIndex from section 0
// section ID 0 = Small block (trainer + pokedex)
// pokedex owned at Small+0x28 (49 bytes), seen at Small+0x5C (49 bytes)
// bits LSB-first, bit N = species N+1, max 386

const SECTOR_SIZE = 0x1000
const SECTOR_DATA = 0xf80
const SLOT_SIZE = 14 * SECTOR_SIZE // 0xE000
const SIG = 0x08012025
const MAX_ID = 386

function readBits(buf: Uint8Array, offset: number, len: number): number[] {
  const ids: number[] = []
  for (let byte = 0; byte < len; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const id = byte * 8 + bit + 1
      if (id > MAX_ID) return ids
      if (buf[offset + byte] & (1 << bit)) ids.push(id)
    }
  }
  return ids
}

function validateSection(buf: Uint8Array, sectorOff: number): boolean {
  const sig =
    (buf[sectorOff + 0xff8] |
      (buf[sectorOff + 0xff9] << 8) |
      (buf[sectorOff + 0xffa] << 16) |
      (buf[sectorOff + 0xffb] << 24)) >>>
    0
  if (sig !== SIG) return false
  const sectionId = buf[sectorOff + 0xff4] | (buf[sectorOff + 0xff5] << 8)
  const checkLen = sectionId === 0 ? 3884 : sectionId === 13 ? 2000 : 3968
  let sum = 0
  for (let i = 0; i < checkLen; i += 4) {
    sum +=
      (buf[sectorOff + i] |
        (buf[sectorOff + i + 1] << 8) |
        (buf[sectorOff + i + 2] << 16) |
        (buf[sectorOff + i + 3] << 24)) >>>
      0
    sum >>>= 0
  }
  const stored = buf[sectorOff + 0xff6] | (buf[sectorOff + 0xff7] << 8)
  const computed = ((sum >> 16) + (sum & 0xffff)) & 0xffff
  return stored === computed
}

function readSmallBlock(buf: Uint8Array, slot: number): Uint8Array | null {
  const start = slot * SLOT_SIZE
  for (let s = 0; s < 14; s++) {
    const off = start + s * SECTOR_SIZE
    const id = buf[off + 0xff4] | (buf[off + 0xff5] << 8)
    if (id === 0) {
      if (!validateSection(buf, off)) return null
      return buf.slice(off, off + SECTOR_DATA)
    }
  }
  return null
}

function getSaveIndex(buf: Uint8Array, slot: number): number {
  const start = slot * SLOT_SIZE
  for (let s = 0; s < 14; s++) {
    const off = start + s * SECTOR_SIZE
    const id = buf[off + 0xff4] | (buf[off + 0xff5] << 8)
    if (id === 0) {
      return (
        (buf[off + 0xffc] |
          (buf[off + 0xffd] << 8) |
          (buf[off + 0xffe] << 16) |
          (buf[off + 0xfff] << 24)) >>>
        0
      )
    }
  }
  return -1
}

export function parseGen3(buf: Uint8Array): (DexData & { version: string }) | null {
  if (buf.length < 0x20000) return null

  // try both slots, pick the one with higher save index
  let bestSlot = -1
  let bestIndex = -1
  for (let slot = 0; slot < 2; slot++) {
    const idx = getSaveIndex(buf, slot)
    if (idx > bestIndex) {
      bestIndex = idx
      bestSlot = slot
    }
  }
  if (bestSlot < 0) return null

  const small = readSmallBlock(buf, bestSlot)
  if (!small) return null

  // game detection: u32 at Small+0xAC
  const gameCode =
    (small[0xac] | (small[0xad] << 8) | (small[0xae] << 16) | (small[0xaf] << 24)) >>> 0
  let version: string
  if (gameCode === 1) {
    version = "firered"
  } else if (gameCode === 0) {
    version = "ruby"
  } else {
    // check if data exists beyond RS small block (0x890)
    let hasData = false
    for (let i = 0x890; i < 0xf2c; i++) {
      if (small[i] !== 0) {
        hasData = true
        break
      }
    }
    version = hasData ? "emerald" : "ruby"
  }

  return {
    caught: readBits(small, 0x28, 49),
    seen: readBits(small, 0x5c, 49),
    version,
  }
}

export function detectGen3GameId(version: string): string {
  return version === "firered" || version === "leafgreen" ? "frlg" : "rse"
}
