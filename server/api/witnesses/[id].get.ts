import { Witness } from '../../models/Witness'
import { decryptField } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const witness = await Witness.findById(id)

  if (!witness) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Témoin introuvable'
    })
  }

  return {
    id: witness._id,
    civility: witness.civility,
    fullName: witness.fullName,
    cni: decryptField(witness.cniEncrypted),
    phone: decryptField(witness.phoneEncrypted),
    isArchived: witness.isArchived,
    createdAt: witness.createdAt
  }
})
