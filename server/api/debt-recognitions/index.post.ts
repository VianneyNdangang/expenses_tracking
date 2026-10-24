import { CreateDebtRecognitionSchema } from '../../../shared/schemas'
import { DebtRecognition } from '../../models/DebtRecognition'
import { getNextSequence } from '../../models/Counter'
import { logAudit } from '../../utils/audit'
import { serializeDebtRecognition } from '../../utils/debtRecognition'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'PATRON', 'SECRETAIRE')
  const body = await readBody(event)
  const validation = CreateDebtRecognitionSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides.'
    })
  }

  const sequence = await getNextSequence('debt_recognition')
  const year = validation.data.recognitionDate.slice(0, 4)
  const recognition = await DebtRecognition.create({
    reference: `RD-${year}-${String(sequence).padStart(5, '0')}`,
    debtorName: validation.data.debtorName,
    creditorName: validation.data.creditorName,
    amount: validation.data.amount,
    recognitionDate: new Date(`${validation.data.recognitionDate}T00:00:00.000Z`),
    dueDate: validation.data.dueDate
      ? new Date(`${validation.data.dueDate}T00:00:00.000Z`)
      : null,
    purpose: validation.data.purpose,
    notes: validation.data.notes,
    status: 'BROUILLON',
    createdById: user._id.toString(),
    createdByName: user.name
  })

  await logAudit(event, {
    action: 'CREATE_DEBT_RECOGNITION',
    entity: 'DebtRecognition',
    entityId: recognition._id.toString(),
    after: {
      reference: recognition.reference,
      debtorName: recognition.debtorName,
      creditorName: recognition.creditorName,
      amount: recognition.amount
    }
  })

  return { success: true, recognition: serializeDebtRecognition(recognition) }
})
