import { access, mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/sprites");
const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const MAX_ID = 649;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function download(id: number): Promise<boolean> {
  const url = `${SPRITE_URL}/${id}.png`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      await writeFile(resolve(OUT_DIR, `${id}.png`), Buffer.from(buf));
      return true;
    } catch (e) {
      if (attempt === 3) {
        console.error(`  #${id} failed: ${e}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return false;
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  let done = 0;
  const workers = Array.from({ length: size }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i]);
      done++;
      if (done % 50 === 0) console.log(`  sprites ${done}/${items.length}`);
    }
  });
  await Promise.all(workers);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1);
  let skipped = 0;
  let failed = 0;
  console.log(`downloading sprites 1-${MAX_ID}...`);
  await pool(ids, 20, async (id) => {
    const dest = resolve(OUT_DIR, `${id}.png`);
    if (await exists(dest)) {
      skipped++;
      return;
    }
    if (!(await download(id))) failed++;
  });
  const got = MAX_ID - skipped - failed;
  console.log(`done. ${got} downloaded, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
