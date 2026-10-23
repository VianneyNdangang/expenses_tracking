import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IItem extends Document {
  name: string
  unit: string
  notes?: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unit: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    isArchived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
)

export const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema)
