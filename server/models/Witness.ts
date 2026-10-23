import mongoose, { Schema, Document, Model } from 'mongoose'
import { encryptField, decryptField } from '../utils/crypto'

export interface IWitness extends Document {
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

const WitnessSchema = new Schema<IWitness>(
  {
    civility: { type: String, enum: ['M.', 'Mme', 'Mlle'], required: true, default: 'M.' },
    fullName: { type: String, required: true, trim: true, index: true },
    cniEncrypted: { type: String, required: true },
    phoneEncrypted: { type: String, required: true },
    isArchived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
)

WitnessSchema.methods.getCni = function(): string {
  return decryptField(this.cniEncrypted)
}

WitnessSchema.methods.getPhone = function(): string {
  return decryptField(this.phoneEncrypted)
}

export const Witness: Model<IWitness> = mongoose.models.Witness || mongoose.model<IWitness>('Witness', WitnessSchema)
