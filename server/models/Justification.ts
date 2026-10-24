import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface IAttachment {
  name: string
  url: string
  size: number
  mimeType: string
}

export interface IJustification extends SqlDocument {
  commitmentId: string
  amountSpent: number
  balance: number
  notes?: string
  attachments: IAttachment[]
  date: Date
  createdAt: Date
}

export const Justification = defineSqlModel<IJustification>('Justification', {
  commitmentId: { type: sqlTypes.UUID, allowNull: false, unique: true },
  amountSpent: { type: sqlTypes.DOUBLE, allowNull: false },
  balance: { type: sqlTypes.DOUBLE, allowNull: false },
  notes: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' },
  attachments: { type: sqlTypes.JSON, allowNull: false, defaultValue: [] },
  date: { type: sqlTypes.DATE, allowNull: false, defaultValue: sqlTypes.NOW }
}, {
  tableName: 'justifications',
  updatedAt: false,
  indexes: [{ fields: ['commitmentId'], unique: true }]
})
