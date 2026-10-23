import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISettings extends Document {
  patronCivility: 'M.' | 'Mme'
  patronName: string
  patronPhone: string
  patronAddress: string
  defaultCity: string
  justificationDelayDays: number
  toleranceThreshold: number // par exemple 10 (pour 10%)
  suspectThreshold: number // par exemple 20 (pour 20%)
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    patronCivility: { type: String, enum: ['M.', 'Mme'], default: 'M.' },
    patronName: { type: String, default: 'M. Abdouraman' },
    patronPhone: { type: String, default: '+237 600 00 00 00' },
    patronAddress: { type: String, default: 'Yaoundé, Cameroun' },
    defaultCity: { type: String, default: 'Yaoundé' },
    justificationDelayDays: { type: Number, default: 7 },
    toleranceThreshold: { type: Number, default: 10 },
    suspectThreshold: { type: Number, default: 20 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
)

export const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)

/**
 * Récupère ou initialise les paramètres uniques de l'application.
 */
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
