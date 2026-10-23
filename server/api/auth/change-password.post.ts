import { ChangePasswordSchema } from '../../../shared/schemas'
import { verifyPassword, hashPassword } from '../../utils/crypto'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)

  const validation = ChangePasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { currentPassword, newPassword } = validation.data

  const isCurrentValid = await verifyPassword(user.passwordHash, currentPassword)
  if (!isCurrentValid) {
    await logAudit(event, {
      action: 'CHANGE_PASSWORD_FAILED_WRONG_CURRENT',
      entity: 'User',
      entityId: user._id.toString()
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Le mot de passe actuel est incorrect'
    })
  }

  user.passwordHash = await hashPassword(newPassword)
  await user.save()

  await logAudit(event, {
    action: 'CHANGE_PASSWORD_SUCCESS',
    entity: 'User',
    entityId: user._id.toString()
  })

  return {
    success: true,
    message: 'Mot de passe modifié avec succès'
  }
})
