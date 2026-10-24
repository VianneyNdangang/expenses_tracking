import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface ISettings extends SqlDocument {
  patronCivility: 'M.' | 'Mme'
  patronName: string
  patronPhone: string
  patronAddress: string
  defaultCity: string
  justificationDelayDays: number
  toleranceThreshold: number
  suspectThreshold: number
  updatedAt: Date
}

export const Settings = defineSqlModel<ISettings>('Settings', {
  patronCivility: { type: sqlTypes.ENUM('M.', 'Mme'), allowNull: false, defaultValue: 'M.' },
  patronName: { type: sqlTypes.STRING, allowNull: false, defaultValue: 'M. Abdouraman' },
  patronPhone: { type: sqlTypes.STRING, allowNull: false, defaultValue: '+237 600 00 00 00' },
  patronAddress: { type: sqlTypes.STRING, allowNull: false, defaultValue: 'Yaoundé, Cameroun' },
  defaultCity: { type: sqlTypes.STRING, allowNull: false, defaultValue: 'Yaoundé' },
  justificationDelayDays: { type: sqlTypes.INTEGER, allowNull: false, defaultValue: 7 },
  toleranceThreshold: { type: sqlTypes.DOUBLE, allowNull: false, defaultValue: 10 },
  suspectThreshold: { type: sqlTypes.DOUBLE, allowNull: false, defaultValue: 20 }
}, { tableName: 'settings', createdAt: false, updatedAt: true })

export async function getOrCreateSettings(): Promise<ISettings> {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({
      patronCivility: 'M.',
      patronName: 'M. Abdouraman',
      patronPhone: '+237 600 00 00 00',
      patronAddress: 'Yaoundé, Cameroun',
      defaultCity: 'Yaoundé',
      justificationDelayDays: 7,
      toleranceThreshold: 10,
      suspectThreshold: 20
    })
  }
  return settings
}
