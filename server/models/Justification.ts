import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IAttachment {
  name: string
  url: string
  size: number
  mimeType: string
}

export interface IJustification extends Document {
  commitmentId: Types.ObjectId
  amountSpent: number // montant réellement dépensé
  balance: number // reliquat = montant payé - montant dépensé (peut être négatif en cas de dépassement)
  notes?: string
  attachments: IAttachment[]
  date: Date
  createdAt: Date
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true }
  },
  { _id: false }
)

const JustificationSchema = new Schema<IJustification>(
  {
    commitmentId: { type: Schema.Types.ObjectId, ref: 'Commitment', required: true, unique: true, index: true },
    amountSpent: { type: Number, required: true },
    balance: { type: Number, required: true },
    notes: { type: String, default: '' },
    attachments: [AttachmentSchema],
    date: { type: Date, required: true, default: Date.now }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Justification: Model<IJustification> = mongoose.models.Justification || mongoose.model<IJustification>('Justification', JustificationSchema)
