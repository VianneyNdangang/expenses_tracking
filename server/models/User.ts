import mongoose, { Schema, Document, Model } from 'mongoose'
import type { UserRole } from '../../shared/schemas'

export interface IUser extends Document {
  username: string
  name: string
  role: UserRole
  passwordHash: string
  totpSecret?: string
  totpEnabled: boolean
  failedLoginAttempts: number
  lockUntil?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['PATRON', 'SECRETAIRE', 'TECHNICIEN'],
      default: 'PATRON',
      required: true
    },
    passwordHash: { type: String, required: true },
    totpSecret: { type: String },
    totpEnabled: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
)

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
