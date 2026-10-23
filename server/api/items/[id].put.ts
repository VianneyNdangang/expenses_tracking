import { Item } from '../../models/Item'
import { ItemSchema } from '../../../shared/schemas'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const validation = ItemSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const item = await Item.findById(id)
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article introuvable'
    })
  }

  const before = item.toObject()
  item.name = validation.data.name
  item.unit = validation.data.unit
  item.notes = validation.data.notes || ''
  await item.save()

  await logAudit(event, {
    action: 'UPDATE_ITEM',
    entity: 'Item',
    entityId: item._id.toString(),
    before,
    after: item.toObject()
  })

  return {
    success: true,
    item: {
      id: item._id,
      name: item.name,
      unit: item.unit,
      notes: item.notes,
      isArchived: item.isArchived
    }
  }
})
