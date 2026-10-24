import { UpdateCredentialsSchema } from '../../../shared/schemas'
import { User } from '../../models/User'
import { hashPassword, verifyPassword } from '../../utils/crypto'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const validation = UpdateCredentialsSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { currentPassword, username, newPassword } = validation.data
  if (!await verifyPassword(user.passwordHash, currentPassword)) {
    await logAudit(event, {
      action: 'UPDATE_CREDENTIALS_FAILED_WRONG_CURRENT',
      entity: 'User',
      entityId: user._id.toString()
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Le mot de passe actuel est incorrect'
    })
  }

  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username })
    if (existingUser && existingUser._id !== user._id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Cet identifiant est déjà utilisé'
      })
    }
  }

  const previousUsername = user.username
  if (username) {
    user.username = username
  }
  if (newPassword) {
    user.passwordHash = await hashPassword(newPassword)
    user.failedLoginAttempts = 0
    user.lockUntil = undefined
  }
  await user.save()

  await logAudit(event, {
    action: 'UPDATE_CREDENTIALS_SUCCESS',
    entity: 'User',
    entityId: user._id.toString(),
    before: { username: previousUsername },
    after: { username: user.username, passwordChanged: !!newPassword }
  })

  return {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  }
})
