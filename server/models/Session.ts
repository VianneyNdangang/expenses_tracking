import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface ISession extends SqlDocument {
  tokenHash: string
  userId: string
  ip: string
  userAgent: string
  expiresAt: Date
  createdAt: Date
}

export const Session = defineSqlModel<ISession>('Session', {
  tokenHash: { type: sqlTypes.STRING(64), allowNull: false, unique: true },
  userId: { type: sqlTypes.UUID, allowNull: false },
  ip: { type: sqlTypes.STRING, allowNull: false, defaultValue: '' },
  userAgent: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' },
  expiresAt: { type: sqlTypes.DATE, allowNull: false }
}, {
  tableName: 'sessions',
  updatedAt: false,
  indexes: [{ fields: ['tokenHash'], unique: true }, { fields: ['userId'] }, { fields: ['expiresAt'] }]
})
