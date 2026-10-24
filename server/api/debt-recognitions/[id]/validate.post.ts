import { DebtRecognition } from '../../../models/DebtRecognition'
import { logAudit } from '../../../utils/audit'
import { serializeDebtRecognition } from '../../../utils/debtRecognition'
import { requireRole } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'PATRON')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })

  const recognition = await DebtRecognition.findById(id)
  if (!recognition) throw createError({ statusCode: 404, statusMessage: 'Reconnaissance de dette introuvable.' })
  if (recognition.status !== 'BROUILLON') {
    throw createError({ statusCode: 409, statusMessage: 'Seule une reconnaissance en brouillon peut être validée.' })
  }
  if (!recognition.signedDocumentRef) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Joignez d’abord la reconnaissance signée avant de la soumettre à validation.'
    })
  }

  recognition.status = 'VALIDEE'
  recognition.validatedById = user._id.toString()
  recognition.validatedByName = user.name
  recognition.validatedAt = new Date()
  await recognition.save()

  await logAudit(event, {
    action: 'VALIDATE_DEBT_RECOGNITION',
    entity: 'DebtRecognition',
    entityId: recognition._id.toString(),
    after: { reference: recognition.reference, validatedBy: user.name }
  })

  return { success: true, recognition: serializeDebtRecognition(recognition) }
})
