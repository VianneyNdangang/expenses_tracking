import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICounter extends Document {
  _id: string
  seq: number
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  { timestamps: false }
)

export const Counter: Model<ICounter> = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema)

/**
 * Obtient le prochain numéro séquentiel de manière atomique.
 */
export async function getNextSequence(name: string, session?: mongoose.ClientSession): Promise<number> {
  const options: any = { new: true, upsert: true }
  if (session) {
    options.session = session
  }
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    options
  )
  return counter!.seq
}
