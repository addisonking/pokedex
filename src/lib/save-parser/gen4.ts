import type { DexData } from "./gen1"

// gen 4: DPPt/HGSS — plaintext blocks, CRC16-CCITT checksum, magic 0x20060623
// save: 512KB (0x80000) = two partitions (A@0x0, B@0x40000), each 0x40000 bytes
// each partition: General block + Storage block
// footer: last 0x14 bytes of General block = [linkage(4), saveIndex(4), size(4), magic(4), type(2), crc(2)]
// pick partition with higher saveIndex
// Zukan4 at PokeDex offset in General: u32 magic(0xbeefcafe), 4 regions of 0x40 bytes
// region 0 = caught, region 1 = seen, bits LSB-first, max 493

const PARTITION = 0x40000
const MAGIC = 0x20060623
const MAX_ID = 493
const REGION_SIZE = 0x40

type Gen4Config = {
  generalSize: number
  storageStart: number
  pokeDex: number
  trainer1: number
  gameId: string
  defaultVersion: string
}

const CONFIGS: Record<string, Gen4Config> = {
  dp: {
    generalSize: 0xc100,
    storageStart: 0xc100,
    pokeDex: 0x12dc,
    trainer1: 0x64,
    gameId: "dpp",
    defaultVersion: "diamond",
  },
  pt: {
    generalSize: 0xcf2c,
    storageStart: 0xcf2c,
    pokeDex: 0x1328,
    trainer1: 0x68,
    gameId: "dpp",
    defaultVersion: "platinum",
  },
  hgss: {
    generalSize: 0xf628,
    storageStart: 0xf700,
    pokeDex: 0x12b8,
    trainer1: 0x64,
    gameId: "hgss",
    defaultVersion: "heartgold",
  },
}

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

function detectConfig(buf: Uint8Array): Gen4Config | null {
  for (const key of Object.keys(CONFIGS)) {
    const cfg = CONFIGS[key]
    const footerOff = cfg.generalSize - 0x14
    const magic =
      (buf[footerOff + 12] |
        (buf[footerOff + 13] << 8) |
        (buf[footerOff + 14] << 16) |
        (buf[footerOff + 15] << 24)) >>>
      0
    if (magic !== MAGIC) continue
    const size =
      (buf[footerOff + 8] |
        (buf[footerOff + 9] << 8) |
        (buf[footerOff + 10] << 16) |
        (buf[footerOff + 11] << 24)) >>>
      0
    if (size === cfg.generalSize) return cfg
  }
  return null
}

export function parseGen4(buf: Uint8Array): (DexData & { version: string }) | null {
  if (buf.length < 0x80000) return null

  const cfg = detectConfig(buf)
  if (!cfg) return null

  // compare save indices to pick active partition
  const footerA = cfg.generalSize - 0x14
  const footerB = PARTITION + cfg.generalSize - 0x14
  const idxA =
    (buf[footerA + 4] |
      (buf[footerA + 5] << 8) |
      (buf[footerA + 6] << 16) |
      (buf[footerA + 7] << 24)) >>>
    0
  const idxB =
    (buf[footerB + 4] |
      (buf[footerB + 5] << 8) |
      (buf[footerB + 6] << 16) |
      (buf[footerB + 7] << 24)) >>>
    0
  const base = idxA >= idxB ? 0 : PARTITION

  // read ROM code for version
  const romCode = buf[base + cfg.trainer1 + 0x1c]
  let version = cfg.defaultVersion
  if (cfg.gameId === "hgss") {
    version = romCode === 7 ? "heartgold" : romCode === 8 ? "soulsilver" : "heartgold"
  } else if (cfg.gameId === "dpp") {
    version =
      romCode === 10
        ? "diamond"
        : romCode === 11
          ? "pearl"
          : romCode === 12
            ? "platinum"
            : cfg.defaultVersion
  }

  const dexOff = base + cfg.pokeDex
  const magic =
    (buf[dexOff] | (buf[dexOff + 1] << 8) | (buf[dexOff + 2] << 16) | (buf[dexOff + 3] << 24)) >>> 0
  if (magic !== 0xbeefcafe) return null

  return {
    caught: readBits(buf, dexOff + 4, REGION_SIZE),
    seen: readBits(buf, dexOff + 4 + REGION_SIZE, REGION_SIZE),
    version,
  }
}

export function detectGen4GameId(version: string): string {
  return version === "heartgold" || version === "soulsilver" ? "hgss" : "dpp"
}
