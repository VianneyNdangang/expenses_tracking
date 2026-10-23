import { SettingsSchema } from '../../../shared/schemas'
import { Settings, getOrCreateSettings } from '../../models/Settings'
import { logAudit } from '../../utils/audit'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON')
  const body = await readBody(event)
  const validation = SettingsSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const settings = await getOrCreateSettings()
  const before = settings.toObject()

  const data = validation.data
  settings.patronCivility = data.patronCivility as any
  settings.patronName = data.patronName
  settings.patronPhone = data.patronPhone
  settings.patronAddress = data.patronAddress
  settings.defaultCity = data.defaultCity
  settings.justificationDelayDays = data.justificationDelayDays
  settings.toleranceThreshold = data.toleranceThreshold
  settings.suspectThreshold = data.suspectThreshold

  await settings.save()

  await logAudit(event, {
    action: 'UPDATE_SETTINGS',
    entity: 'Settings',
    entityId: settings._id.toString(),
    before,
    after: settings.toObject()
  })

  return {
    success: true,
    settings: {
      id: settings._id,
      patronCivility: settings.patronCivility,
      patronName: settings.patronName,
      patronPhone: settings.patronPhone,
      patronAddress: settings.patronAddress,
      defaultCity: settings.defaultCity,
      justificationDelayDays: settings.justificationDelayDays,
      toleranceThreshold: settings.toleranceThreshold,
      suspectThreshold: settings.suspectThreshold
    }
  }
})
