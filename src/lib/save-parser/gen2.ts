import type { DexData } from "./gen1"

// gen 2: GSC — no encryption, dual save slots
// Gold/Silver: primary @ 0x2009, checksum u16 sum(0x2009..0x2D68) @ 0x2D69
// Crystal:     primary @ 0x2009, checksum u16 sum(0x2009..0x2B82) @ 0x2D0D
//              secondary @ 0x1209, checksum u16 sum(0x1209..0x1D82) @ 0x1F0D
// pokedex owned: 32 bytes @ (base + 0xA43), seen: 32 bytes @ (base + 0xA63)
// bits LSB-first, bit N set = national id N+1, max 251

const DEX_LEN = 32
const MAX_ID = 251

function readBits(buf: Uint8Array, offset: number): number[] {
  const ids: number[] = []
  for (let byte = 0; byte < DEX_LEN; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const id = byte * 8 + bit + 1
      if (id > MAX_ID) return ids
      if (buf[offset + byte] & (1 << bit)) ids.push(id)
    }
  }
  return ids
}

function cs16(buf: Uint8Array, start: number, end: number, off: number): boolean {
  let sum = 0
  for (let i = start; i <= end; i++) sum = (sum + buf[i]) & 0xffff
  return sum === (buf[off] | (buf[off + 1] << 8))
}

export function parseGen2(buf: Uint8Array): (DexData & { version: string }) | null {
  if (buf.length < 0x8000) return null

  // try Gold/Silver primary
  if (cs16(buf, 0x2009, 0x2d68, 0x2d69)) {
    return {
      caught: readBits(buf, 0x2a4c),
      seen: readBits(buf, 0x2a6c),
      version: "gold",
    }
  }

  // try Crystal primary
  if (cs16(buf, 0x2009, 0x2b82, 0x2d0d)) {
    return {
      caught: readBits(buf, 0x2a4c),
      seen: readBits(buf, 0x2a6c),
      version: "crystal",
    }
  }

  // try Crystal secondary
  if (cs16(buf, 0x1209, 0x1d82, 0x1f0d)) {
    return {
      caught: readBits(buf, 0x1c4c),
      seen: readBits(buf, 0x1c6c),
      version: "crystal",
    }
  }

  return null
}
