export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isLoaded, checkAuth } = useAuth()

  if (!isLoaded.value) {
    await checkAuth()
  }

  // Si l'utilisateur n'est pas connecté et tente d'accéder à une autre page que /login
  if (!isAuthenticated.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // Si l'utilisateur est déjà connecté et va sur /login
  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }

  // Protection des routes réservées exclusivement au Patron
  const patronOnlyPrefixes = ['/parametres', '/audit']
  if (patronOnlyPrefixes.some(prefix => to.path.startsWith(prefix))) {
    const { isPatron } = useAuth()
    if (!isPatron.value) {
      return navigateTo('/')
    }
  }
})
