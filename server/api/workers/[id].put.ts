import { PersonSchema } from '../../../shared/schemas'
import { Worker } from '../../models/Worker'
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

  const worker = await Worker.findById(id)
  if (!worker) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Employé introuvable'
    })
  }

  const { civility, fullName, cni, phone } = validation.data

  worker.civility = civility
  worker.fullName = fullName
  worker.cniEncrypted = encryptField(cni)
  worker.phoneEncrypted = encryptField(phone)
  await worker.save()

  await logAudit(event, {
    action: 'UPDATE_WORKER',
    entity: 'Worker',
    entityId: worker._id.toString(),
    after: { civility, fullName, cniMasked: maskSensitive(cni), phoneMasked: maskSensitive(phone) }
  })

  return {
    success: true,
    worker: {
      id: worker._id,
      civility: worker.civility,
      fullName: worker.fullName,
      cniMasked: maskSensitive(cni),
      phoneMasked: maskSensitive(phone),
      isArchived: worker.isArchived
    }
  }
})
