import { CreatePaymentSchema } from '../../../shared/schemas'
import { Commitment } from '../../models/Commitment'
import { Payment } from '../../models/Payment'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON')
  const body = await readBody(event)
  const validation = CreatePaymentSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { commitmentId, amount, date, method, reference, notes } = validation.data

  const commitment = await Commitment.findById(commitmentId)
  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  if (commitment.status !== 'Accepté') {
    throw createError({
      statusCode: 400,
      statusMessage: `Un paiement ne peut être enregistré que pour un engagement au statut "Accepté" (statut actuel : "${commitment.status}").`
    })
  }

  const paymentDate = date ? new Date(date) : new Date()

  // Transaction MongoDB (Replica Set) : écriture atomique du paiement + transition du statut
  const paymentDoc = await withTransaction(async (session) => {
    const created = await Payment.create(
      [
        {
          commitmentId: commitment._id,
          amount,
          date: paymentDate,
          method,
          reference: reference || '',
          notes: notes || ''
        }
      ],
      { session }
    )

    commitment.status = 'Payé'
    await commitment.save({ session })

    return created[0]
  })

  await logAudit(event, {
    action: 'RECORD_PAYMENT',
    entity: 'Payment',
    entityId: paymentDoc._id.toString(),
    after: {
      commitmentId: commitment._id,
      letterNumber: commitment.letterNumber,
      amount,
      method,
      reference
    }
  })

  return {
    success: true,
    payment: {
      id: paymentDoc._id,
      amount: paymentDoc.amount,
      date: paymentDoc.date,
      method: paymentDoc.method,
      reference: paymentDoc.reference
    },
    commitmentStatus: commitment.status
  }
})
