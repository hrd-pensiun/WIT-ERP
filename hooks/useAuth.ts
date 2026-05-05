import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

interface AppUser {
  id: string
  email: string
  metadata?: Record<string, unknown>
  profileRole?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!insForge) {
      setLoading(false)
      return
    }

    let isMounted = true
    insForge.auth.getCurrentUser().then(async ({ data, error }) => {
      if (!isMounted) return

      if (error || !data?.user) {
        setUser(null)
        setIsAuthenticated(false)
      } else {
        let profileRole: string | null = null
        const tenantId = getTenantId()
        try {
          const byUserId = await insForge
            .from('user_profiles')
            .select('app_role')
            .eq('tenant_id', tenantId)
            .eq('user_id', data.user.id)
            .maybeSingle()

          profileRole = (byUserId.data as { app_role?: string | null } | null)?.app_role ?? null

          if (!profileRole && data.user.email) {
            const byEmail = await insForge
              .from('user_profiles')
              .select('app_role')
              .eq('tenant_id', tenantId)
              .eq('email', data.user.email)
              .maybeSingle()
            profileRole = (byEmail.data as { app_role?: string | null } | null)?.app_role ?? null
          }
        } catch {
          profileRole = null
        }

        setUser({
          id: data.user.id,
          email: data.user.email,
          metadata: data.user.metadata,
          profileRole,
        })
        setIsAuthenticated(true)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    if (!insForge) {
      return { success: false, error: 'InsForge client is not configured' }
    }

    setLoading(true)

    const { data, error } = await insForge.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      setLoading(false)
      return { success: false, error: error?.message ?? 'Registration failed' }
    }

    // If auto-confirm is enabled, user and session will be returned
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        metadata: data.user.user_metadata,
      })
      setIsAuthenticated(true)
    }

    setLoading(false)
    return { success: true, user: data?.user, session: data?.session }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!insForge) {
      return { success: false, error: 'InsForge client is not configured' }
    }

    setLoading(true)

    const { data, error } = await insForge.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data?.user) {
      setLoading(false)
      return { success: false, error: error?.message ?? 'Invalid email or password' }
    }

    let profileRole: string | null = null
    const tenantId = getTenantId()
    try {
      const byUserId = await insForge
        .from('user_profiles')
        .select('app_role')
        .eq('tenant_id', tenantId)
        .eq('user_id', data.user.id)
        .maybeSingle()
      profileRole = (byUserId.data as { app_role?: string | null } | null)?.app_role ?? null
      if (!profileRole && data.user.email) {
        const byEmail = await insForge
          .from('user_profiles')
          .select('app_role')
          .eq('tenant_id', tenantId)
          .eq('email', data.user.email)
          .maybeSingle()
        profileRole = (byEmail.data as { app_role?: string | null } | null)?.app_role ?? null
      }
    } catch {
      profileRole = null
    }

    setUser({
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.metadata,
      profileRole,
    })
    setIsAuthenticated(true)
    setLoading(false)

    return { success: true, user: data.user }
  }, [])

  const signOut = useCallback(async () => {
    if (!insForge) return

    await insForge.auth.signOut()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const hasRole = useCallback((roles: string[]) => {
    const metadataRole = user?.metadata?.role
    const profileRole = user?.profileRole
    if (typeof metadataRole === 'string' && roles.includes(metadataRole)) return true
    return typeof profileRole === 'string' ? roles.includes(profileRole) : false
  }, [user])

  return {
    user,
    isAuthenticated,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole
  }
}
