import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISession extends Document {
  tokenHash: string
  userId: Types.ObjectId
  ip: string
  userAgent: string
  expiresAt: Date
  createdAt: Date
}

const SessionSchema = new Schema<ISession>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Index TTL : MongoDB supprime automatiquement les sessions expirées
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)
