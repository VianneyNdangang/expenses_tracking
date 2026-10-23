import { CancelCommitmentSchema } from '../../../../shared/schemas'
import { Commitment } from '../../../models/Commitment'
import { logAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const validation = CancelCommitmentSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Motif d’annulation requis'
    })
  }

  const commitment = await Commitment.findById(id)
  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  if (commitment.isCancelled) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cet engagement a déjà été annulé'
    })
  }

  const beforeStatus = commitment.status
  commitment.isCancelled = true
  commitment.cancellationReason = validation.data.reason
  await commitment.save()

  await logAudit(event, {
    action: 'CANCEL_COMMITMENT',
    entity: 'Commitment',
    entityId: commitment._id.toString(),
    before: { status: beforeStatus, isCancelled: false },
    after: {
      isCancelled: true,
      cancellationReason: commitment.cancellationReason
    }
  })

  return {
    success: true,
    message: 'Engagement annulé avec traçabilité complète dans le journal d’audit'
  }
})
