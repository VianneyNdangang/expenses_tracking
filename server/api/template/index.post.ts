import { LetterTemplateSchema } from '../../../shared/schemas'
import { LetterTemplate } from '../../models/LetterTemplate'
import { verifyPassword } from '../../utils/crypto'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'PATRON')

  const body = await readBody(event)
  const validation = LetterTemplateSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { content, password } = validation.data

  // 1. Vérification du mot de passe du patron
  const isPasswordValid = await verifyPassword(user.passwordHash, password)
  if (!isPasswordValid) {
    await logAudit(event, {
      action: 'CREATE_LETTER_TEMPLATE_FAILED_WRONG_PASSWORD',
      entity: 'LetterTemplate',
      notes: 'Tentative de création de version de modèle avec mot de passe incorrect'
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Mot de passe patron incorrect. La création de la nouvelle version a été refusée.'
    })
  }

  // 2. Création de la nouvelle version et activation atomique
  const newTemplate = await withTransaction(async (session) => {
    // Trouver le dernier numéro de version
    const lastVersionDoc = await LetterTemplate.findOne().sort({ version: -1 }).session(session)
    const nextVersion = lastVersionDoc ? lastVersionDoc.version + 1 : 1

    // Désactiver les versions antérieures
    await LetterTemplate.updateMany({}, { $set: { isActive: false } }, { session })

    // Créer la nouvelle version active
    const created = await LetterTemplate.create(
      [
        {
          version: nextVersion,
          content,
          isActive: true
        }
      ],
      { session }
    )

    return created[0]
  })

  await logAudit(event, {
    action: 'CREATE_LETTER_TEMPLATE_VERSION',
    entity: 'LetterTemplate',
    entityId: newTemplate._id.toString(),
    after: { version: newTemplate.version }
  })

  return {
    success: true,
    message: `La version v${newTemplate.version} du modèle de lettre a été créée et activée avec succès`,
    template: {
      id: newTemplate._id,
      version: newTemplate.version,
      content: newTemplate.content,
      isActive: true
    }
  }
})
