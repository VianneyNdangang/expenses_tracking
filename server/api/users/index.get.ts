import { User } from '../../models/User'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  // Seul le patron peut gérer les utilisateurs
  requireRole(event, 'PATRON')

  const users = await User.find()
    .select('_id username name role lastLoginAt failedLoginAttempts lockUntil createdAt')
    .sort({ createdAt: 1 })

  return {
    users: users.map(u => ({
      id: u._id,
      username: u.username,
      name: u.name,
      role: u.role || 'PATRON',
      lastLoginAt: u.lastLoginAt,
      isLocked: !!(u.lockUntil && u.lockUntil.getTime() > Date.now()),
      createdAt: u.createdAt
    }))
  }
})
