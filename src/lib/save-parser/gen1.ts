export type DexData = { seen: number[]; caught: number[] }

function readBits(buf: Uint8Array, offset: number, len: number, maxId: number): number[] {
  const ids: number[] = []
  for (let byte = 0; byte < len; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const id = byte * 8 + bit + 1
      if (id > maxId) return ids
      if (buf[offset + byte] & (1 << bit)) ids.push(id)
    }
  }
  return ids
}

// gen 1: RBY — no encryption, single save slot
// checksum: 255 - sum(0x2598..0x3522) == buf[0x3523]
// owned: 19 bytes @ 0x25A3, seen: 19 bytes @ 0x25B6
// bits LSB-first, bit N set = national id N+1
// yellow detectable via pikachu friendship @ 0x271C (non-zero)

export function parseGen1(buf: Uint8Array): DexData | null {
  if (buf.length < 0x3524) return null
  let cs = 255
  for (let i = 0x2598; i <= 0x3522; i++) cs = (cs - buf[i]) & 0xff
  if (cs !== buf[0x3523]) return null
  return {
    caught: readBits(buf, 0x25a3, 19, 151),
    seen: readBits(buf, 0x25b6, 19, 151),
  }
}

export function detectGen1Version(buf: Uint8Array): string {
  return buf[0x271c] !== 0 ? "yellow" : "red"
}
