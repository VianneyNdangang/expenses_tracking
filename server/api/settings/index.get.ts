import { getOrCreateSettings } from '../../models/Settings'

export default defineEventHandler(async () => {
  const settings = await getOrCreateSettings()
  return {
    id: settings._id,
    patronCivility: settings.patronCivility,
    patronName: settings.patronName,
    patronPhone: settings.patronPhone,
    patronAddress: settings.patronAddress,
    defaultCity: settings.defaultCity,
    justificationDelayDays: settings.justificationDelayDays,
    toleranceThreshold: settings.toleranceThreshold,
    suspectThreshold: settings.suspectThreshold,
    updatedAt: settings.updatedAt
  }
})
