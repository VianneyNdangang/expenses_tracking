export default defineEventHandler(async (event) => {
  const user = event.context.user
  const session = event.context.session

  return {
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role || 'PATRON',
      lastLoginAt: user.lastLoginAt,
      totpEnabled: user.totpEnabled
    },
    session: {
      id: session._id,
      ip: session.ip,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt
    }
  }
})
