import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface IPayment extends SqlDocument {
  commitmentId: string
  amount: number
  date: Date
  method: 'Espèces' | 'Virement' | 'Chèque' | 'Mobile Money' | 'Autre'
  reference?: string
  notes?: string
  createdAt: Date
}

export const Payment = defineSqlModel<IPayment>('Payment', {
  commitmentId: { type: sqlTypes.UUID, allowNull: false },
  amount: { type: sqlTypes.DOUBLE, allowNull: false },
  date: { type: sqlTypes.DATE, allowNull: false, defaultValue: sqlTypes.NOW },
  method: { type: sqlTypes.ENUM('Espèces', 'Virement', 'Chèque', 'Mobile Money', 'Autre'), allowNull: false, defaultValue: 'Espèces' },
  reference: { type: sqlTypes.STRING, allowNull: false, defaultValue: '' },
  notes: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' }
}, { tableName: 'payments', updatedAt: false, indexes: [{ fields: ['commitmentId'] }] })
