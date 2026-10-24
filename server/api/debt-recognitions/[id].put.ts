import { UpdateDebtRecognitionSchema } from '../../../shared/schemas'
import { DebtRecognition } from '../../models/DebtRecognition'
import { logAudit } from '../../utils/audit'
import { serializeDebtRecognition } from '../../utils/debtRecognition'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })

  const recognition = await DebtRecognition.findById(id)
  if (!recognition) throw createError({ statusCode: 404, statusMessage: 'Reconnaissance de dette introuvable.' })
  if (recognition.status !== 'BROUILLON') {
    throw createError({ statusCode: 409, statusMessage: 'Une reconnaissance validée ne peut plus être modifiée.' })
  }

  const validation = UpdateDebtRecognitionSchema.safeParse(await readBody(event))
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides.'
    })
  }
  if (Object.keys(validation.data).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Aucune modification reçue.' })
  }

  const before = {
    debtorName: recognition.debtorName,
    creditorName: recognition.creditorName,
    amount: recognition.amount,
    purpose: recognition.purpose
  }
  const changes = { ...validation.data } as Record<string, unknown>
  if (validation.data.recognitionDate) {
    changes.recognitionDate = new Date(`${validation.data.recognitionDate}T00:00:00.000Z`)
  }
  if (validation.data.dueDate !== undefined) {
    changes.dueDate = validation.data.dueDate
      ? new Date(`${validation.data.dueDate}T00:00:00.000Z`)
      : null
  }
  await recognition.update(changes)

  await logAudit(event, {
    action: 'UPDATE_DEBT_RECOGNITION',
    entity: 'DebtRecognition',
    entityId: recognition._id.toString(),
    before,
    after: {
      debtorName: recognition.debtorName,
      creditorName: recognition.creditorName,
      amount: recognition.amount,
      purpose: recognition.purpose
    }
  })

  return { success: true, recognition: serializeDebtRecognition(recognition) }
})
