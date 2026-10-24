import { ActivateTemplateSchema } from '../../../shared/schemas'
import { LetterTemplate } from '../../models/LetterTemplate'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'PATRON')

  const body = await readBody(event)
  const validation = ActivateTemplateSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { version } = validation.data

  const targetTemplate = await LetterTemplate.findOne({ version })
  if (!targetTemplate) {
    throw createError({
      statusCode: 404,
      statusMessage: `Le modèle de lettre version v${version} est introuvable`
    })
  }

  await withTransaction(async (session) => {
    // 1. Désactiver tous les modèles existants
    await LetterTemplate.updateMany({}, { $set: { isActive: false } }, { transaction: session })

    // 2. Activer le modèle sélectionné
    targetTemplate.isActive = true
    await targetTemplate.save({ transaction: session })
  })

  await logAudit(event, {
    action: 'ACTIVATE_LETTER_TEMPLATE_VERSION',
    entity: 'LetterTemplate',
    entityId: targetTemplate._id.toString(),
    after: { version: targetTemplate.version }
  })

  return {
    success: true,
    message: `Le modèle de lettre v${targetTemplate.version} a été activé avec succès`,
    template: {
      id: targetTemplate._id,
      version: targetTemplate.version,
      content: targetTemplate.content,
      isActive: true
    }
  }
})
