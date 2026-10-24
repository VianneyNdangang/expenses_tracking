import { AuditLog } from '../../models/AuditLog'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'TECHNICIEN')
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const page = Math.max(Number(query.page) || 1, 1)
  const skip = (page - 1) * limit

  const filter: Record<string, unknown> = {}
  if (query.entity) {
    filter.entity = query.entity
  }
  if (query.action) {
    filter.action = query.action
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter)
  ])

  return {
    logs: logs.map(l => ({
      id: l._id,
      timestamp: l.timestamp,
      userName: l.userName,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      before: l.before,
      after: l.after,
      ip: l.ip
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
})
