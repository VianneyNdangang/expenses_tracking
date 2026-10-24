import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'
import type { UserRole } from '../../shared/schemas'

export interface IUser extends SqlDocument {
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

export const User = defineSqlModel<IUser>('User', {
  username: {
    type: sqlTypes.STRING,
    allowNull: false,
    unique: true,
    set(value: string) {
      this.setDataValue('username', value.trim().toLowerCase())
    }
  },
  name: { type: sqlTypes.STRING, allowNull: false },
  role: { type: sqlTypes.ENUM('PATRON', 'SECRETAIRE', 'TECHNICIEN'), allowNull: false, defaultValue: 'PATRON' },
  passwordHash: { type: sqlTypes.STRING, allowNull: false },
  totpSecret: { type: sqlTypes.STRING, allowNull: true },
  totpEnabled: { type: sqlTypes.BOOLEAN, allowNull: false, defaultValue: false },
  failedLoginAttempts: { type: sqlTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lockUntil: { type: sqlTypes.DATE, allowNull: true },
  lastLoginAt: { type: sqlTypes.DATE, allowNull: true }
}, { tableName: 'users', indexes: [{ fields: ['username'], unique: true }] })
