import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export type DebtRecognitionStatus = 'BROUILLON' | 'VALIDEE' | 'JUSTIFIEE'

export interface IDebtRecognition extends SqlDocument {
  reference: string
  debtorName: string
  creditorName: string
  amount: number
  recognitionDate: Date
  dueDate?: Date | null
  purpose: string
  notes: string
  status: DebtRecognitionStatus
  createdById: string
  createdByName: string
  validatedById?: string | null
  validatedByName?: string | null
  validatedAt?: Date | null
  justifiedById?: string | null
  justifiedByName?: string | null
  justifiedAt?: Date | null
  signedDocumentRef?: string | null
  signedDocumentFilename?: string | null
  justificationRef?: string | null
  justificationFilename?: string | null
  createdAt: Date
  updatedAt: Date
}

export const DebtRecognition = defineSqlModel<IDebtRecognition>('DebtRecognition', {
  reference: { type: sqlTypes.STRING, allowNull: false, unique: true },
  debtorName: { type: sqlTypes.STRING, allowNull: false },
  creditorName: { type: sqlTypes.STRING, allowNull: false },
  amount: { type: sqlTypes.DOUBLE, allowNull: false },
  recognitionDate: { type: sqlTypes.DATE, allowNull: false },
  dueDate: { type: sqlTypes.DATE, allowNull: true },
  purpose: { type: sqlTypes.TEXT, allowNull: false },
  notes: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' },
  status: { type: sqlTypes.ENUM('BROUILLON', 'VALIDEE', 'JUSTIFIEE'), allowNull: false, defaultValue: 'BROUILLON' },
  createdById: { type: sqlTypes.STRING, allowNull: false },
  createdByName: { type: sqlTypes.STRING, allowNull: false },
  validatedById: { type: sqlTypes.STRING, allowNull: true },
  validatedByName: { type: sqlTypes.STRING, allowNull: true },
  validatedAt: { type: sqlTypes.DATE, allowNull: true },
  justifiedById: { type: sqlTypes.STRING, allowNull: true },
  justifiedByName: { type: sqlTypes.STRING, allowNull: true },
  justifiedAt: { type: sqlTypes.DATE, allowNull: true },
  signedDocumentRef: { type: sqlTypes.STRING, allowNull: true },
  signedDocumentFilename: { type: sqlTypes.STRING, allowNull: true },
  justificationRef: { type: sqlTypes.STRING, allowNull: true },
  justificationFilename: { type: sqlTypes.STRING, allowNull: true }
}, {
  tableName: 'debt_recognitions',
  indexes: [
    { fields: ['reference'], unique: true },
    { fields: ['recognitionDate'] },
    { fields: ['status'] }
  ]
})
