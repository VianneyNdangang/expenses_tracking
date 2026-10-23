import { User } from '../../models/User'
import { CreateUserSchema } from '../../../shared/schemas'
import { hashPassword } from '../../utils/crypto'
import { requireRole } from '../../utils/roles'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const patron = requireRole(event, 'PATRON')
  const body = await readBody(event)

  const validation = CreateUserSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { username, name, role, password } = validation.data

  const existing = await User.findOne({ username: username.toLowerCase() })
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: `Un utilisateur avec l'identifiant "${username}" existe déjà.`
    })
  }

  const passwordHash = await hashPassword(password)
  const newUser = await User.create({
    username: username.toLowerCase(),
    name,
    role,
    passwordHash,
    failedLoginAttempts: 0
  })

  await logAudit(event, {
    action: 'CREATE_USER',
    entity: 'User',
    entityId: newUser._id.toString(),
    after: {
      username: newUser.username,
      name: newUser.name,
      role: newUser.role
    }
  })

  return {
    success: true,
    user: {
      id: newUser._id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt
    }
  }
})
