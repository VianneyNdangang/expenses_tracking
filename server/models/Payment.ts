import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IPayment extends Document {
  commitmentId: Types.ObjectId
  amount: number
  date: Date
  method: 'Espèces' | 'Virement' | 'Chèque' | 'Mobile Money' | 'Autre'
  reference?: string
  notes?: string
  createdAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    commitmentId: { type: Schema.Types.ObjectId, ref: 'Commitment', required: true, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: ['Espèces', 'Virement', 'Chèque', 'Mobile Money', 'Autre'],
      required: true,
      default: 'Espèces'
    },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)
