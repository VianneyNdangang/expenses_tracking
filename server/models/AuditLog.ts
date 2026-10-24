import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface IAuditLog extends SqlDocument {
  timestamp: Date
  userId?: string
  userName: string
  action: string
  entity: string
  entityId?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip: string
  userAgent: string
}

export const AuditLog = defineSqlModel<IAuditLog>('AuditLog', {
  timestamp: { type: sqlTypes.DATE, allowNull: false, defaultValue: sqlTypes.NOW },
  userId: { type: sqlTypes.UUID, allowNull: true },
  userName: { type: sqlTypes.STRING, allowNull: false, defaultValue: 'Système' },
  action: { type: sqlTypes.STRING, allowNull: false },
  entity: { type: sqlTypes.STRING, allowNull: false },
  entityId: { type: sqlTypes.STRING, allowNull: true },
  before: { type: sqlTypes.JSON, allowNull: true },
  after: { type: sqlTypes.JSON, allowNull: true },
  ip: { type: sqlTypes.STRING, allowNull: false, defaultValue: '' },
  userAgent: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' }
}, {
  tableName: 'audit_logs',
  timestamps: false,
  indexes: [{ fields: ['timestamp'] }, { fields: ['action'] }, { fields: ['entity'] }]
})
