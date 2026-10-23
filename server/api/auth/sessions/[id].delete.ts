import { Session } from '../../../models/Session'
import { logAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const currentSession = event.context.session
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant de session manquant'
    })
  }

  if (sessionId === currentSession._id.toString()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Impossible de révoquer la session active par ce biais. Utilisez la déconnexion.'
    })
  }

  const result = await Session.deleteOne({
    _id: sessionId,
    userId: user._id
  })

  if (result.deletedCount === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session introuvable'
    })
  }

  await logAudit(event, {
    action: 'REVOKE_SESSION',
    entity: 'Session',
    entityId: sessionId
  })

  return {
    success: true,
    message: 'Session révoquée avec succès'
  }
})
