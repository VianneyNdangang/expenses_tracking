import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export type CommitmentType = 'MATERIEL' | 'PRET' | 'SALAIRE' | 'AUTRE'

export interface ICommitmentLine {
  itemId: string
  name: string
  unit: string
  quantity: number
  unitPriceDeclared: number
  totalPriceDeclared: number
  referenceUnitPrice: number
  tolerancePercent: number
  differenceValue: number
  differencePercent: number
  status: 'conforme' | 'a_verifier' | 'suspect'
}

export interface ICommitmentWitness {
  witnessId: string
  civility: string
  fullName: string
  cniMasked: string
  phoneMasked: string
}

export interface ICommitment extends SqlDocument {
  type: CommitmentType
  letterNumber: string
  seq: number
  workerId: string
  workerSnapshot: {
    civility: string
    fullName: string
    cniMasked: string
    phoneMasked: string
  }
  purpose: string
  city: string
  date: Date
  templateVersion: number
  witnesses: ICommitmentWitness[]
  items: ICommitmentLine[]
  amountRequested: number
  amountApproved: number
  status: 'Demandé' | 'Accepté' | 'Payé' | 'Justifié' | 'Refusé'
  signedLetterScanUrl?: string
  signedLetterScanFilename?: string
  cancellationReason?: string
  isCancelled: boolean
  refusalReason?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export const Commitment = defineSqlModel<ICommitment>('Commitment', {
  type: { type: sqlTypes.ENUM('MATERIEL', 'PRET', 'SALAIRE', 'AUTRE'), allowNull: false, defaultValue: 'MATERIEL' },
  letterNumber: { type: sqlTypes.STRING, allowNull: false, unique: true },
  seq: { type: sqlTypes.INTEGER, allowNull: false, unique: true },
  workerId: { type: sqlTypes.UUID, allowNull: false },
  workerSnapshot: { type: sqlTypes.JSON, allowNull: false },
  purpose: { type: sqlTypes.TEXT, allowNull: false },
  city: { type: sqlTypes.STRING, allowNull: false },
  date: { type: sqlTypes.DATE, allowNull: false, defaultValue: sqlTypes.NOW },
  templateVersion: { type: sqlTypes.INTEGER, allowNull: false, defaultValue: 1 },
  witnesses: { type: sqlTypes.JSON, allowNull: false, defaultValue: [] },
  items: { type: sqlTypes.JSON, allowNull: false, defaultValue: [] },
  amountRequested: { type: sqlTypes.DOUBLE, allowNull: false },
  amountApproved: { type: sqlTypes.DOUBLE, allowNull: false, defaultValue: 0 },
  status: { type: sqlTypes.ENUM('Demandé', 'Accepté', 'Payé', 'Justifié', 'Refusé'), allowNull: false, defaultValue: 'Demandé' },
  signedLetterScanUrl: { type: sqlTypes.STRING, allowNull: true },
  signedLetterScanFilename: { type: sqlTypes.STRING, allowNull: true },
  cancellationReason: { type: sqlTypes.TEXT, allowNull: true },
  isCancelled: { type: sqlTypes.BOOLEAN, allowNull: false, defaultValue: false },
  refusalReason: { type: sqlTypes.TEXT, allowNull: true },
  notes: { type: sqlTypes.TEXT, allowNull: false, defaultValue: '' }
}, {
  tableName: 'commitments',
  indexes: [{ fields: ['type'] }, { fields: ['letterNumber'], unique: true }, { fields: ['seq'], unique: true }, { fields: ['workerId'] }, { fields: ['status'] }]
})
