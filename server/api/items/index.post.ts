import { Item } from '../../models/Item'
import { ItemPrice } from '../../models/ItemPrice'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'
import { CreateItemSchema, CreateItemsSchema } from '../../../shared/schemas'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'TECHNICIEN')
  const body = await readBody(event)
  const isBulk = Array.isArray(body)
  const validation = isBulk
    ? CreateItemsSchema.safeParse(body)
    : CreateItemSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const items = Array.isArray(validation.data) ? validation.data : [validation.data]

  for (const item of items) {
    const existing = await Item.findOne({
      name: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    })
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: `Un article portant le nom « ${item.name} » existe déjà`
      })
    }
  }

  const results = await withTransaction(async (session) => {
    const createdResults = []
    for (const { name, unit, referencePrice, tolerancePercent, notes } of items) {
      const createdItem = await Item.create({ name, unit, notes, isArchived: false }, { transaction: session })

      const itemPrice = await ItemPrice.create({
        itemId: createdItem._id,
        referencePrice,
        tolerancePercent,
        startDate: new Date(),
        endDate: null,
        notes: 'Prix initial de référence'
      }, { transaction: session })

      createdResults.push({
        item: createdItem,
        price: itemPrice,
        response: {
          id: createdItem._id,
          name: createdItem.name,
          unit: createdItem.unit,
          referencePrice: itemPrice.referencePrice,
          tolerancePercent: itemPrice.tolerancePercent,
          isArchived: false
        }
      })
    }

    return createdResults
  })

  for (const [index, result] of results.entries()) {
    const item = items[index]!
    await logAudit(event, {
      action: 'CREATE_ITEM',
      entity: 'Item',
      entityId: result.item._id.toString(),
      after: {
        name: item.name,
        unit: item.unit,
        referencePrice: item.referencePrice,
        tolerancePercent: item.tolerancePercent
      }
    })
  }

  if (isBulk) {
    return {
      success: true,
      items: results.map(result => result.response)
    }
  }

  const result = results[0]!
  return {
    success: true,
    item: result.response
  }
})
