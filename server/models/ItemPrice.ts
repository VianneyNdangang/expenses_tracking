import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface IItemPrice extends SqlDocument {
  itemId: string
  referencePrice: number
  tolerancePercent: number
  startDate: Date
  endDate?: Date | null
  notes?: string
  createdAt: Date
}

export const ItemPrice = defineSqlModel<IItemPrice>('ItemPrice', {
  itemId: { type: sqlTypes.UUID, allowNull: false },
  referencePrice: { type: sqlTypes.DOUBLE, allowNull: false },
  tolerancePercent: { type: sqlTypes.DOUBLE, allowNull: false, defaultValue: 10 },
  startDate: { type: sqlTypes.DATE, allowNull: false, defaultValue: sqlTypes.NOW },
  endDate: { type: sqlTypes.DATE, allowNull: true, defaultValue: null },
  notes: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' }
}, {
  tableName: 'item_prices',
  updatedAt: false,
  indexes: [{ fields: ['itemId', 'endDate'] }]
})
