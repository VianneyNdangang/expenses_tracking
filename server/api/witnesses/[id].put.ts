import { PersonSchema } from '../../../shared/schemas'
import { Witness } from '../../models/Witness'
import { encryptField, maskSensitive } from '../../utils/crypto'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const validation = PersonSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const witness = await Witness.findById(id)
  if (!witness) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Témoin introuvable'
    })
  }

  const { civility, fullName, cni, phone } = validation.data

  witness.civility = civility
  witness.fullName = fullName
  witness.cniEncrypted = encryptField(cni)
  witness.phoneEncrypted = encryptField(phone)
  await witness.save()

  await logAudit(event, {
    action: 'UPDATE_WITNESS',
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
      isArchived: witness.isArchived
    }
  }
})
