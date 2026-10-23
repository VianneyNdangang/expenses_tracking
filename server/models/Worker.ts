import mongoose, { Schema, Document, Model } from 'mongoose'
import { encryptField, decryptField } from '../utils/crypto'

export interface IWorker extends Document {
  civility: 'M.' | 'Mme' | 'Mlle'
  fullName: string
  cniEncrypted: string
  phoneEncrypted: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  // Getters virtuels pour déchiffrer
  getCni(): string
  getPhone(): string
}

const WorkerSchema = new Schema<IWorker>(
  {
    civility: { type: String, enum: ['M.', 'Mme', 'Mlle'], required: true, default: 'M.' },
    fullName: { type: String, required: true, trim: true, index: true },
    cniEncrypted: { type: String, required: true },
    phoneEncrypted: { type: String, required: true },
    isArchived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
)

WorkerSchema.methods.getCni = function(): string {
  return decryptField(this.cniEncrypted)
}

WorkerSchema.methods.getPhone = function(): string {
  return decryptField(this.phoneEncrypted)
}

export const Worker: Model<IWorker> = mongoose.models.Worker || mongoose.model<IWorker>('Worker', WorkerSchema)
