import { User } from '../../models/User'
import { Session } from '../../models/Session'
import { requireRole } from '../../utils/roles'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const currentPatron = requireRole(event, 'PATRON')
  const id = getRouterParam(event, 'id')

  if (currentPatron._id.toString() === id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vous ne pouvez pas supprimer votre propre compte actuellement connecté.'
    })
  }

  const user = await User.findById(id)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur introuvable'
    })
  }

  if (user.role === 'PATRON') {
    const patronCount = await User.countDocuments({ role: 'PATRON' })
    if (patronCount <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Impossible de supprimer le dernier compte Patron.'
      })
    }
  }

  // Supprimer les sessions de cet utilisateur
  await Session.deleteMany({ userId: user._id })
  await User.deleteOne({ _id: user._id })

  await logAudit(event, {
    action: 'DELETE_USER',
    entity: 'User',
    entityId: user._id.toString(),
    before: { username: user.username, name: user.name, role: user.role }
  })

  return {
    success: true,
    message: `L'utilisateur "${user.name}" (${user.username}) a été supprimé avec succès.`
  }
})
