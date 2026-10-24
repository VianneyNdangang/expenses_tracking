import { CreateJustificationSchema } from '../../../shared/schemas'
import { Commitment } from '../../models/Commitment'
import { Payment } from '../../models/Payment'
import { Justification } from '../../models/Justification'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = CreateJustificationSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { commitmentId, amountSpent, notes, date } = validation.data

  const commitment = await Commitment.findById(commitmentId)
  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  if (commitment.status !== 'Payé') {
    throw createError({
      statusCode: 400,
      statusMessage: `Une justification ne peut être enregistrée que pour un engagement au statut "Payé" (statut actuel : "${commitment.status}").`
    })
  }

  const payment = await Payment.findOne({ commitmentId: commitment._id })
  const amountPaid = payment ? payment.amount : (commitment.amountApproved || commitment.amountRequested)

  // Reliquat = Montant décaissé/payé − Montant réellement dépensé
  const balance = amountPaid - amountSpent
  const justificationDate = date ? new Date(date) : new Date()

  // Transaction MySQL : enregistrement de la justification et changement de statut
  const justificationDoc = await withTransaction(async (session) => {
    const created = await Justification.create({
      commitmentId: commitment._id,
      amountSpent,
      balance,
      notes: notes || '',
      date: justificationDate,
      attachments: []
    }, { transaction: session })

    commitment.status = 'Justifié'
    await commitment.save({ transaction: session })

    return created
  })

  await logAudit(event, {
    action: 'RECORD_JUSTIFICATION',
    entity: 'Justification',
    entityId: justificationDoc._id.toString(),
    after: {
      commitmentId: commitment._id,
      letterNumber: commitment.letterNumber,
      amountSpent,
      balance,
      isDeficit: balance < 0
    }
  })

  return {
    success: true,
    justification: {
      id: justificationDoc._id,
      amountSpent: justificationDoc.amountSpent,
      balance: justificationDoc.balance,
      date: justificationDoc.date,
      notes: justificationDoc.notes
    },
    commitmentStatus: commitment.status
  }
})
