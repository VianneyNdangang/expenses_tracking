import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface IItem extends SqlDocument {
  name: string
  unit: string
  notes?: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export const Item = defineSqlModel<IItem>('Item', {
  name: { type: sqlTypes.STRING, allowNull: false, unique: true },
  unit: { type: sqlTypes.STRING, allowNull: false },
  notes: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' },
  isArchived: { type: sqlTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, { tableName: 'items', indexes: [{ fields: ['isArchived'] }] })
