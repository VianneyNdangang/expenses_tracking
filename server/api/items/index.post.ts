import { Item } from '../../models/Item'
import { ItemPrice } from '../../models/ItemPrice'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'
import { CreateItemSchema } from '../../../shared/schemas'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'TECHNICIEN')
  const body = await readBody(event)
  const validation = CreateItemSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { name, unit, referencePrice, tolerancePercent, notes } = validation.data

  const existing = await Item.findOne({ name: new RegExp(`^${name}$`, 'i') })
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Un article portant ce nom existe déjà'
    })
  }

  const result = await withTransaction(async (session) => {
    const createdItem = await Item.create({ name, unit, notes, isArchived: false }, { transaction: session })

    const itemPrice = await ItemPrice.create({
      itemId: createdItem._id,
      referencePrice,
      tolerancePercent,
      startDate: new Date(),
      endDate: null,
      notes: 'Prix initial de référence'
    }, { transaction: session })

    return { item: createdItem, price: itemPrice }
  })

  await logAudit(event, {
    action: 'CREATE_ITEM',
    entity: 'Item',
    entityId: result.item._id.toString(),
    after: { name, unit, referencePrice, tolerancePercent }
  })

  return {
    success: true,
    item: {
      id: result.item._id,
      name: result.item.name,
      unit: result.item.unit,
      referencePrice: result.price.referencePrice,
      tolerancePercent: result.price.tolerancePercent,
      isArchived: false
    }
  }
})
