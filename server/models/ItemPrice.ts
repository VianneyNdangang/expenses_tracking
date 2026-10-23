import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IItemPrice extends Document {
  itemId: Types.ObjectId
  referencePrice: number
  tolerancePercent: number
  startDate: Date
  endDate?: Date | null
  notes?: string
  createdAt: Date
}

const ItemPriceSchema = new Schema<IItemPrice>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    referencePrice: { type: Number, required: true }, // Entier en FCFA
    tolerancePercent: { type: Number, required: true, default: 10 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Index pour trouver rapidement le prix actif d'un article
ItemPriceSchema.index({ itemId: 1, endDate: 1 })

export const ItemPrice: Model<IItemPrice> = mongoose.models.ItemPrice || mongoose.model<IItemPrice>('ItemPrice', ItemPriceSchema)
