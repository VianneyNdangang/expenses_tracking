import { Worker } from '../../../models/Worker'
import { logAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const worker = await Worker.findById(id)

  if (!worker) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Employé introuvable'
    })
  }

  worker.isArchived = !worker.isArchived
  await worker.save()

  await logAudit(event, {
    action: worker.isArchived ? 'ARCHIVE_WORKER' : 'UNARCHIVE_WORKER',
    entity: 'Worker',
    entityId: worker._id.toString()
  })

  return {
    success: true,
    isArchived: worker.isArchived,
    message: worker.isArchived ? 'Employé archivé' : 'Employé réactivé'
  }
})
