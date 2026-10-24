import { User } from '../../models/User'
import { UpdateUserSchema } from '../../../shared/schemas'
import { hashPassword } from '../../utils/crypto'
import { requireRole } from '../../utils/roles'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const currentPatron = requireRole(event, 'PATRON')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const validation = UpdateUserSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const user = await User.findById(id)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur introuvable'
    })
  }

  const { name, role, password } = validation.data
  if (user._id === currentPatron._id && role && role !== user.role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Vous ne pouvez pas modifier le rôle de votre propre compte.'
    })
  }

  const before = { name: user.name, role: user.role }

  // Protection : empêcher de rétrograder le dernier patron
  if (role && role !== 'PATRON' && user.role === 'PATRON') {
    const patronCount = await User.countDocuments({ role: 'PATRON' })
    if (patronCount <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Impossible de changer le rôle du seul compte Patron de l’application.'
      })
    }
  }

  if (name) user.name = name
  if (role) user.role = role
  if (password) {
    user.passwordHash = await hashPassword(password)
    user.failedLoginAttempts = 0
    user.lockUntil = undefined
  }

  await user.save()

  await logAudit(event, {
    action: 'UPDATE_USER',
    entity: 'User',
    entityId: user._id.toString(),
    before,
    after: { name: user.name, role: user.role, passwordChanged: !!password }
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
