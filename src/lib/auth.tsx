import type { Session, User } from "@supabase/supabase-js"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { supabase } from "./supabase"

type AuthCtx = {
  session: Session | null
  user: User | null
  loading: boolean
  isAnonymous: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInAnonymously: () => Promise<{ error: string | null }>
  upgradeAnon: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const C = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signInAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously()
    return { error: error?.message ?? null }
  }, [])

  const upgradeAnon = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAnonymous: session?.user?.is_anonymous ?? false,
      signUp,
      signIn,
      signInAnonymously,
      upgradeAnon,
      signOut,
    }),
    [session, loading, signUp, signIn, signInAnonymously, upgradeAnon, signOut],
  )

  return <C.Provider value={value}>{children}</C.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(C)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
