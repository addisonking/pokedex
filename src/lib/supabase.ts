import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — set them in .env.local")
}

export const supabase = createClient(url ?? "http://localhost:8000", key ?? "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
