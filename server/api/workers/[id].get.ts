import { Worker } from '../../models/Worker'
import { decryptField } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const worker = await Worker.findById(id)

  if (!worker) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Employé introuvable'
    })
  }

  return {
    id: worker._id,
    civility: worker.civility,
    fullName: worker.fullName,
    cni: decryptField(worker.cniEncrypted),
    phone: decryptField(worker.phoneEncrypted),
    isArchived: worker.isArchived,
    createdAt: worker.createdAt
  }
})
