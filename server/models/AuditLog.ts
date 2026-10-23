import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IAuditLog extends Document {
  timestamp: Date
  userId?: Types.ObjectId
  userName: string
  action: string
  entity: string
  entityId?: string
  before?: any
  after?: any
  ip: string
  userAgent: string
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'Système' },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  { timestamps: false }
)

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
