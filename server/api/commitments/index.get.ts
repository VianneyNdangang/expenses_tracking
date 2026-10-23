import { Commitment } from '../../models/Commitment'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filter: any = {}

  // Filtre par statut
  if (query.status && query.status !== 'all') {
    if (query.status === 'Annulé') {
      filter.isCancelled = true
    } else {
      filter.status = query.status
      filter.isCancelled = { $ne: true }
    }
  }

  // Filtre par employé
  if (query.workerId) {
    filter.workerId = query.workerId
  }

  // Filtre par type d'engagement
  if (query.type && query.type !== 'all') {
    filter.type = query.type
  }

  // Recherche textuelle sur le motif ou numéro de lettre
  if (query.search) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i')
    filter.$or = [
      { purpose: searchRegex },
      { letterNumber: searchRegex },
      { 'workerSnapshot.fullName': searchRegex }
    ]
  }

  // Filtre par plage de dates
  if (query.startDate || query.endDate) {
    filter.date = {}
    if (query.startDate) {
      filter.date.$gte = new Date(String(query.startDate))
    }
    if (query.endDate) {
      const end = new Date(String(query.endDate))
      end.setHours(23, 59, 59, 999)
      filter.date.$lte = end
    }
  }

  const commitments = await Commitment.find(filter)
    .sort({ seq: -1 })
    .lean()

  return commitments.map((c) => ({
    id: c._id,
    type: c.type || 'MATERIEL',
    letterNumber: c.letterNumber,
    seq: c.seq,
    workerId: c.workerId,
    workerName: `${c.workerSnapshot.civility} ${c.workerSnapshot.fullName}`,
    purpose: c.purpose,
    city: c.city,
    date: c.date,
    amountRequested: c.amountRequested,
    amountApproved: c.amountApproved,
    amount: c.amountApproved > 0 ? c.amountApproved : c.amountRequested,
    status: c.isCancelled ? 'Annulé' : c.status,
    itemsCount: c.items.length,
    hasSuspectItems: c.items.some((i) => i.status === 'suspect'),
    hasToCheckItems: c.items.some((i) => i.status === 'a_verifier'),
    hasScan: !!c.signedLetterScanUrl,
    isCancelled: c.isCancelled,
    createdAt: c.createdAt
  }))
})
