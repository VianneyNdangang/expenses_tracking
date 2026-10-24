import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'
import { decryptField } from '../utils/crypto'

export interface IWitness extends SqlDocument {
  civility: 'M.' | 'Mme' | 'Mlle'
  fullName: string
  cniEncrypted: string
  phoneEncrypted: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  getCni(): string
  getPhone(): string
}

export const Witness = defineSqlModel<IWitness>('Witness', {
  civility: { type: sqlTypes.ENUM('M.', 'Mme', 'Mlle'), allowNull: false, defaultValue: 'M.' },
  fullName: { type: sqlTypes.STRING, allowNull: false },
  cniEncrypted: { type: sqlTypes.TEXT, allowNull: false },
  phoneEncrypted: { type: sqlTypes.TEXT, allowNull: false },
  isArchived: { type: sqlTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, { tableName: 'witnesses', indexes: [{ fields: ['fullName'] }, { fields: ['isArchived'] }] }, {
  getCni(this: IWitness): string {
    return decryptField(this.cniEncrypted)
  },
  getPhone(this: IWitness): string {
    return decryptField(this.phoneEncrypted)
  }
})
