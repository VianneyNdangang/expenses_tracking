import { Commitment } from '../../models/Commitment'
import { Payment } from '../../models/Payment'
import { Justification } from '../../models/Justification'
import { getOrCreateSettings } from '../../models/Settings'
import { formatFCFA } from '../../../shared/currency'

export default defineEventHandler(async () => {
  const settings = await getOrCreateSettings()
  const delayDays = settings.justificationDelayDays || 7
  const now = new Date()

  // 1. Tous les engagements non annulés
  const commitments = await Commitment.find({ isCancelled: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean()

  // 2. Tous les paiements
  const payments = await Payment.find().lean()
  const paymentMap = new Map(payments.map(p => [p.commitmentId.toString(), p]))

  // 3. Toutes les justifications
  const justifications = await Justification.find().lean()

  // Calculs financiers stricts
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  let totalCommitted = 0
  const statusCounts = {
    Demandé: 0,
    Accepté: 0,
    Payé: 0,
    Justifié: 0,
    Refusé: 0
  }

  let totalPendingJustificationAmount = 0
  const alerts: any[] = []

  for (const c of commitments) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1

    if (['Accepté', 'Payé', 'Justifié'].includes(c.status)) {
      totalCommitted += c.amountApproved || c.amountRequested
    }

    if (c.status === 'Payé') {
      const pmt = paymentMap.get(c._id.toString())
      const paidAmt = pmt ? pmt.amount : (c.amountApproved || c.amountRequested)
      totalPendingJustificationAmount += paidAmt

      // Vérification du délai de justification
      const pmtDate = pmt ? new Date(pmt.date) : new Date(c.date)
      const deadline = new Date(pmtDate.getTime() + delayDays * 24 * 60 * 60 * 1000)

      if (now > deadline) {
        const daysLate = Math.floor((now.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000)) + 1
        alerts.push({
          commitmentId: c._id,
          letterNumber: c.letterNumber,
          workerName: `${c.workerSnapshot.civility} ${c.workerSnapshot.fullName}`,
          amountPaid: paidAmt,
          formattedAmountPaid: formatFCFA(paidAmt),
          daysLate,
          paymentDate: pmtDate,
          deadline
        })
      }
    }
  }

  // Reliquats et dépassements
  let totalBalanceRestitue = 0
  let totalDeficit = 0

  for (const j of justifications) {
    if (j.balance > 0) {
      totalBalanceRestitue += j.balance
    } else if (j.balance < 0) {
      totalDeficit += Math.abs(j.balance)
    }
  }

  // 5 derniers engagements
  const recentCommitments = commitments.slice(0, 5).map(c => ({
    id: c._id,
    letterNumber: c.letterNumber,
    workerName: `${c.workerSnapshot.civility} ${c.workerSnapshot.fullName}`,
    purpose: c.purpose,
    date: c.date,
    amountRequested: c.amountRequested,
    amountApproved: c.amountApproved,
    status: c.status,
    formattedAmount: formatFCFA(c.amountApproved > 0 ? c.amountApproved : c.amountRequested)
  }))

  return {
    kpis: {
      totalCommitted,
      formattedTotalCommitted: formatFCFA(totalCommitted),
      totalPaid,
      formattedTotalPaid: formatFCFA(totalPaid),
      totalPendingJustification: totalPendingJustificationAmount,
      formattedTotalPendingJustification: formatFCFA(totalPendingJustificationAmount),
      totalBalanceRestitue,
      formattedTotalBalanceRestitue: formatFCFA(totalBalanceRestitue),
      totalDeficit,
      formattedTotalDeficit: formatFCFA(totalDeficit)
    },
    statusCounts,
    alerts,
    recentCommitments,
    settings: {
      justificationDelayDays: delayDays,
      currency: 'FCFA'
    }
  }
})
