import * as XLSX from 'xlsx'
import { Commitment } from '../../models/Commitment'
import { Payment } from '../../models/Payment'
import { Justification } from '../../models/Justification'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const format = String(query.format || 'excel').toLowerCase()

  const filter: any = {}
  if (query.status && query.status !== 'all') {
    if (query.status === 'Annulé') {
      filter.isCancelled = true
    } else {
      filter.status = query.status
      filter.isCancelled = { $ne: true }
    }
  }
  if (query.workerId) {
    filter.workerId = query.workerId
  }
  if (query.type && query.type !== 'all') {
    filter.type = query.type
  }
  if (query.search) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i')
    filter.$or = [
      { purpose: searchRegex },
      { letterNumber: searchRegex },
      { 'workerSnapshot.fullName': searchRegex }
    ]
  }
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

  const commitments = await Commitment.find(filter).sort({ seq: 1 }).lean()
  const payments = await Payment.find().lean()
  const paymentMap = new Map(payments.map(p => [p.commitmentId.toString(), p]))

  const justifications = await Justification.find().lean()
  const justifMap = new Map(justifications.map(j => [j.commitmentId.toString(), j]))

  // 1. Feuille récapitulative des engagements
  const summaryRows = commitments.map(c => {
    const pmt = paymentMap.get(c._id.toString())
    const jst = justifMap.get(c._id.toString())

    return {
      'Numéro Lettre': c.letterNumber,
      'Nature': c.type || 'MATERIEL',
      'Date': new Date(c.date).toISOString().split('T')[0],
      'Ville': c.city,
      'Employé': `${c.workerSnapshot.civility} ${c.workerSnapshot.fullName}`,
      'CNI (Masquée)': c.workerSnapshot.cniMasked,
      'Téléphone (Masqué)': c.workerSnapshot.phoneMasked,
      'Motif': c.purpose,
      'Montant Demandé (FCFA)': c.amountRequested,
      'Montant Accordé (FCFA)': c.amountApproved,
      'Statut': c.status,
      'Montant Payé (FCFA)': pmt ? pmt.amount : 0,
      'Mode Paiement': pmt ? pmt.method : '',
      'Date Paiement': pmt ? new Date(pmt.date).toISOString().split('T')[0] : '',
      'Montant Dépensé (FCFA)': jst ? jst.amountSpent : 0,
      'Reliquat Restitué (FCFA)': jst ? jst.balance : 0,
      'Notes': c.notes || ''
    }
  })

  // 2. Feuille détaillée de toutes les lignes d'articles
  const detailedLinesRows: any[] = []
  for (const c of commitments) {
    for (const item of c.items) {
      detailedLinesRows.push({
        'Numéro Lettre': c.letterNumber,
        'Employé': c.workerSnapshot.fullName,
        'Article': item.name,
        'Unité': item.unit,
        'Quantité': item.quantity,
        'Prix Unitaire Déclaré (FCFA)': item.unitPriceDeclared,
        'Total Déclaré (FCFA)': item.totalPriceDeclared,
        'Prix Réf. Figé (FCFA)': item.referenceUnitPrice,
        'Écart Valeur (FCFA)': item.differenceValue,
        'Écart (%)': item.differencePercent,
        'Conformité': item.status
      })
    }
  }

  const wb = XLSX.utils.book_new()
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  const wsDetails = XLSX.utils.json_to_sheet(detailedLinesRows)

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Engagements')
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Lignes Articles')

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(wsSummary)
    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(event, 'Content-Disposition', 'attachment; filename="engagements_export.csv"')
    return csvContent
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', 'attachment; filename="engagements_depenses.xlsx"')
  return excelBuffer
})
