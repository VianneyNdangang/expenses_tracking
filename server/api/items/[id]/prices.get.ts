import { ItemPrice } from '../../../models/ItemPrice'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const prices = await ItemPrice.find({ itemId: id })
    .sort({ startDate: -1 })
    .lean()

  return prices.map(p => ({
    id: p._id,
    referencePrice: p.referencePrice,
    tolerancePercent: p.tolerancePercent,
    startDate: p.startDate,
    endDate: p.endDate,
    notes: p.notes,
    isActive: p.endDate === null
  }))
})
