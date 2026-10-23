import { Commitment } from '../../../models/Commitment'
import { ApproveCommitmentSchema } from '../../../../shared/schemas'
import { logAudit } from '../../../utils/audit'
import { requireRole } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const validation = ApproveCommitmentSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const commitment = await Commitment.findById(id)
  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  if (commitment.status !== 'Demandé') {
    throw createError({
      statusCode: 400,
      statusMessage: `Impossible de modifier la décision. L'engagement est déjà au statut "${commitment.status}".`
    })
  }

  const { approved, amountApproved, refusalReason } = validation.data
  const beforeStatus = commitment.status

  if (approved) {
    commitment.status = 'Accepté'
    commitment.amountApproved = amountApproved && amountApproved > 0 ? amountApproved : commitment.amountRequested
    commitment.refusalReason = undefined
  } else {
    commitment.status = 'Refusé'
    commitment.amountApproved = 0
    commitment.refusalReason = refusalReason || 'Refusé par la direction'
  }

  await commitment.save()

  await logAudit(event, {
    action: approved ? 'APPROVE_COMMITMENT' : 'REFUSE_COMMITMENT',
    entity: 'Commitment',
    entityId: commitment._id.toString(),
    before: { status: beforeStatus },
    after: {
      status: commitment.status,
      amountApproved: commitment.amountApproved,
      refusalReason: commitment.refusalReason
    }
  })

  return {
    success: true,
    commitment: {
      id: commitment._id,
      status: commitment.status,
      amountApproved: commitment.amountApproved,
      refusalReason: commitment.refusalReason
    }
  }
})
