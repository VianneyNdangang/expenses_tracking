import { Item } from '../../../models/Item'
import { logAudit } from '../../../utils/audit'
import { requireRole } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'TECHNICIEN')
  const id = getRouterParam(event, 'id')
  const item = await Item.findById(id)

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article introuvable'
    })
  }

  const beforeArchived = item.isArchived
  item.isArchived = !item.isArchived
  await item.save()

  await logAudit(event, {
    action: item.isArchived ? 'ARCHIVE_ITEM' : 'UNARCHIVE_ITEM',
    entity: 'Item',
    entityId: item._id.toString(),
    before: { isArchived: beforeArchived },
    after: { isArchived: item.isArchived }
  })

  return {
    success: true,
    isArchived: item.isArchived,
    message: item.isArchived ? 'Article archivé' : 'Article restauré'
  }
})
