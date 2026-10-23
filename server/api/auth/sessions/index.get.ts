import { Session } from '../../../models/Session'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const currentSession = event.context.session

  const sessions = await Session.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .lean()

  return sessions.map((s) => ({
    id: s._id,
    ip: s.ip,
    userAgent: s.userAgent,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    isCurrent: s._id.toString() === currentSession._id.toString()
  }))
})
