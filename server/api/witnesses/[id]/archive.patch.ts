import { Witness } from '../../../models/Witness'
import { logAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const witness = await Witness.findById(id)

  if (!witness) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Témoin introuvable'
    })
  }

  witness.isArchived = !witness.isArchived
  await witness.save()

  await logAudit(event, {
    action: witness.isArchived ? 'ARCHIVE_WITNESS' : 'UNARCHIVE_WITNESS',
    entity: 'Witness',
    entityId: witness._id.toString()
  })

  return {
    success: true,
    isArchived: witness.isArchived,
    message: witness.isArchived ? 'Témoin archivé' : 'Témoin réactivé'
  }
})
