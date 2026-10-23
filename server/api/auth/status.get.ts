import { validateSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const auth = await validateSession(event)
  if (!auth) {
    return { authenticated: false }
  }

  return {
    authenticated: true,
    user: {
      id: auth.user._id,
      username: auth.user.username,
      name: auth.user.name,
      role: auth.user.role || 'PATRON',
      lastLoginAt: auth.user.lastLoginAt
    }
  }
})
