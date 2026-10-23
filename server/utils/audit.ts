import type { H3Event } from 'h3'
import { AuditLog } from '../models/AuditLog'

interface AuditOptions {
  action: string
  entity: string
  entityId?: string
  before?: any
  after?: any
  metadata?: any
}

export async function logAudit(event: H3Event | null, options: AuditOptions) {
  try {
    const user = event?.context?.user
    const ip = event ? getRequestIP(event, { xForwardedFor: true }) || '' : ''
    const userAgent = event ? getRequestHeader(event, 'user-agent') || '' : ''

    await AuditLog.create({
      timestamp: new Date(),
      userId: user?._id,
      userName: user?.name || user?.username || 'Système / Script',
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      before: options.before ? JSON.parse(JSON.stringify(options.before)) : undefined,
      after: options.after ? JSON.parse(JSON.stringify(options.after)) : undefined,
      ip,
      userAgent
    })
  } catch (err: any) {
    console.error('Erreur lors de l’écriture du journal d’audit:', err.message)
  }
}
