import { PersonSchema } from '../../../shared/schemas'
import { Witness } from '../../models/Witness'
import { encryptField, maskSensitive } from '../../utils/crypto'
import { logAudit } from '../../utils/audit'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')
  const body = await readBody(event)
  const validation = PersonSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { civility, fullName, cni, phone } = validation.data

  const witness = await Witness.create({
    civility,
    fullName,
    cniEncrypted: encryptField(cni),
    phoneEncrypted: encryptField(phone),
    isArchived: false
  })

  await logAudit(event, {
    action: 'CREATE_WITNESS',
    entity: 'Witness',
    entityId: witness._id.toString(),
    after: { civility, fullName, cniMasked: maskSensitive(cni), phoneMasked: maskSensitive(phone) }
  })

  return {
    success: true,
    witness: {
      id: witness._id,
      civility: witness.civility,
      fullName: witness.fullName,
      cniMasked: maskSensitive(cni),
      phoneMasked: maskSensitive(phone),
      isArchived: false
    }
  }
})
