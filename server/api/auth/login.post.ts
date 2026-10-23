import { User } from '../../models/User'
import { LoginSchema } from '../../../shared/schemas'
import { verifyPassword } from '../../utils/crypto'
import { createSession } from '../../utils/session'
import { logAudit } from '../../utils/audit'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = LoginSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données de connexion invalides'
    })
  }

  const { username, password } = validation.data
  const user = await User.findOne({ username: username.toLowerCase() })

  // Message d'erreur générique anti-énumération
  const genericError = createError({
    statusCode: 401,
    statusMessage: 'Identifiant ou mot de passe incorrect'
  })

  if (!user) {
    await logAudit(event, {
      action: 'LOGIN_FAILED_UNKNOWN_USER',
      entity: 'User',
      metadata: { attemptedUsername: username }
    })
    throw genericError
  }

  // Vérification du verrouillage de sécurité
  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000))
    throw createError({
      statusCode: 429,
      statusMessage: `Compte temporairement verrouillé pour des raisons de sécurité. Réessayez dans ${remainingMinutes} minute(s).`
    })
  }

  // Vérification du mot de passe Argon2id
  const isPasswordValid = await verifyPassword(user.passwordHash, password)

  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
    }
    await user.save()

    await logAudit(event, {
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user._id.toString()
    })

    throw genericError
  }

  // Réinitialisation des tentatives et mise à jour de la dernière connexion
  user.failedLoginAttempts = 0
  user.lockUntil = undefined
  user.lastLoginAt = new Date()
  await user.save()

  // Création de la session sécurisée
  const { session } = await createSession(event, user)

  await logAudit(event, {
    action: 'LOGIN_SUCCESS',
    entity: 'User',
    entityId: user._id.toString(),
    metadata: { sessionId: session._id.toString() }
  })

  return {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role || 'PATRON'
    }
  }
})
