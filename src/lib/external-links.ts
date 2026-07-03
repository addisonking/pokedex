import { openUrl } from "@tauri-apps/plugin-opener"

// In Tauri's webview, target="_blank" links do nothing — route them to the
// system browser instead. No-op in a regular browser.
export function installTauriLinkHandler() {
  if (!("__TAURI_INTERNALS__" in window)) return
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null
    const anchor = target?.closest?.('a[target="_blank"]') as HTMLAnchorElement | null
    if (!anchor?.href) return
    e.preventDefault()
    openUrl(anchor.href).catch(console.error)
  })
}
