import { connectToDatabase } from '../utils/db'
import { validateSession } from '../utils/session'

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/status'
]

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]

  // Ne s'applique qu'aux routes API
  if (!path.startsWith('/api/')) {
    return
  }

  // Connexion préalable à la base de données
  await connectToDatabase()

  // Protection CSRF pour les requêtes mutantes (POST, PUT, PATCH, DELETE)
  const method = event.method.toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = getRequestHeader(event, 'origin')
    const host = getRequestHeader(event, 'host')

    if (origin && host) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Requête interdite (Échec de la validation CSRF / Origine non autorisée)'
          })
        }
      } catch (err: any) {
        if (err.statusCode === 403) throw err
      }
    }
  }

  // Les routes publiques d'authentification ne requièrent pas de session préalable
  if (PUBLIC_API_ROUTES.includes(path)) {
    return
  }

  // Vérification de la session active
  const auth = await validateSession(event)
  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session invalide ou expirée. Veuillez vous reconnecter.'
    })
  }

  // Injecte l'utilisateur et la session dans le contexte de l'événement
  event.context.user = auth.user
  event.context.session = auth.session
})
