import { relaunch } from "@tauri-apps/plugin-process"
import { check } from "@tauri-apps/plugin-updater"

const isTauri = "__TAURI_INTERNALS__" in window

export type UpdateInfo = { version: string; date?: string; body?: string }

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (!isTauri) return null
  const update = await check()
  if (!update) return null
  return {
    version: update.version,
    date: update.date ?? undefined,
    body: update.body ?? undefined,
  }
}

export async function downloadAndInstallUpdate(): Promise<void> {
  if (!isTauri) return
  const update = await check()
  if (!update) return
  await update.downloadAndInstall()
  await relaunch()
}
