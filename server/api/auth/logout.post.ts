import { destroySession } from '../../utils/session'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user) {
    await logAudit(event, {
      action: 'LOGOUT',
      entity: 'User',
      entityId: user._id.toString()
    })
  }

  await destroySession(event)

  return {
    success: true,
    message: 'Déconnexion réussie'
  }
})
