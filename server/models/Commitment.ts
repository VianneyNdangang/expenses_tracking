import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type CommitmentType = 'MATERIEL' | 'PRET' | 'SALAIRE' | 'AUTRE'

export interface ICommitmentLine {
  itemId: Types.ObjectId
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
  witnessId: Types.ObjectId
  civility: string
  fullName: string
  cniMasked: string
  phoneMasked: string
}

export interface ICommitment extends Document {
  type: CommitmentType
  letterNumber: string
  seq: number
  workerId: Types.ObjectId
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

const CommitmentLineSchema = new Schema<ICommitmentLine>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPriceDeclared: { type: Number, required: true },
    totalPriceDeclared: { type: Number, required: true },
    referenceUnitPrice: { type: Number, required: true },
    tolerancePercent: { type: Number, required: true },
    differenceValue: { type: Number, required: true },
    differencePercent: { type: Number, required: true },
    status: { type: String, enum: ['conforme', 'a_verifier', 'suspect'], required: true }
  },
  { _id: false }
)

const CommitmentWitnessSchema = new Schema<ICommitmentWitness>(
  {
    witnessId: { type: Schema.Types.ObjectId, ref: 'Witness', required: true },
    civility: { type: String, required: true },
    fullName: { type: String, required: true },
    cniMasked: { type: String, required: true },
    phoneMasked: { type: String, required: true }
  },
  { _id: false }
)

const CommitmentSchema = new Schema<ICommitment>(
  {
    type: {
      type: String,
      enum: ['MATERIEL', 'PRET', 'SALAIRE', 'AUTRE'],
      required: true,
      default: 'MATERIEL',
      index: true
    },
    letterNumber: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, required: true, unique: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
    workerSnapshot: {
      civility: { type: String, required: true },
      fullName: { type: String, required: true },
      cniMasked: { type: String, required: true },
      phoneMasked: { type: String, required: true }
    },
    purpose: { type: String, required: true, trim: true, index: 'text' },
    city: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    templateVersion: { type: Number, required: true, default: 1 },
    witnesses: [CommitmentWitnessSchema],
    items: [CommitmentLineSchema],
    amountRequested: { type: Number, required: true },
    amountApproved: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Demandé', 'Accepté', 'Payé', 'Justifié', 'Refusé'],
      required: true,
      default: 'Demandé',
      index: true
    },
    signedLetterScanUrl: { type: String },
    signedLetterScanFilename: { type: String },
    cancellationReason: { type: String },
    isCancelled: { type: Boolean, default: false },
    refusalReason: { type: String },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
)

export const Commitment: Model<ICommitment> = mongoose.models.Commitment || mongoose.model<ICommitment>('Commitment', CommitmentSchema)
