import type { UserRole } from '../../shared/schemas'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: UserRole
  lastLoginAt?: string
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const isLoaded = useState<boolean>('auth_loaded', () => false)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed<UserRole>(() => user.value?.role || 'PATRON')

  const isPatron = computed(() => role.value === 'PATRON')
  const isSecretaire = computed(() => role.value === 'SECRETAIRE')
  const isTechnicien = computed(() => role.value === 'TECHNICIEN')

  const hasRole = (...allowed: UserRole[]): boolean => {
    if (!user.value) return false
    return allowed.includes(role.value)
  }

  const roleLabel = computed(() => {
    switch (role.value) {
      case 'PATRON':
        return 'Patron'
      case 'SECRETAIRE':
        return 'Secrétaire'
      case 'TECHNICIEN':
        return 'Technicien'
      default:
        return 'Utilisateur'
    }
  })

  const roleBadgeColor = computed(() => {
    switch (role.value) {
      case 'PATRON':
        return 'emerald'
      case 'SECRETAIRE':
        return 'sky'
      case 'TECHNICIEN':
        return 'amber'
      default:
        return 'neutral'
    }
  })

  // Forward the incoming cookie during SSR so page reloads reuse the session.
  const requestFetch = useRequestFetch()

  const checkAuth = async () => {
    const data = await requestFetch<{ authenticated: boolean, user?: AuthUser }>('/api/auth/status')
    if (data.authenticated && data.user) {
      user.value = data.user
    } else {
      user.value = null
    }

    isLoaded.value = true
    return isAuthenticated.value
  }

  const login = async (credentials: { username: string, password: string, totpCode?: string }) => {
    const data = await $fetch<{ success: boolean, user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    user.value = data.user
    return data
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      await navigateTo('/login')
    }
  }

  return {
    user,
    isLoaded,
    isAuthenticated,
    role,
    isPatron,
    isSecretaire,
    isTechnicien,
    hasRole,
    roleLabel,
    roleBadgeColor,
    checkAuth,
    login,
    logout
  }
}
