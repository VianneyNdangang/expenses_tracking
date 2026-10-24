import PDFDocument from 'pdfkit'
import { amountInWordsFCFA, formatFCFA } from '../../shared/currency'
import type { IDebtRecognition } from '../models/DebtRecognition'

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { timeZone: 'UTC', dateStyle: 'long' })

export function generateDebtRecognitionPdf(recognition: IDebtRecognition): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      margin: 52,
      info: {
        Title: `Reconnaissance de dette ${recognition.reference}`,
        Author: recognition.creditorName,
        Subject: 'Reconnaissance de dette'
      }
    })

    const chunks: Buffer[] = []
    document.on('data', chunk => chunks.push(chunk))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)

    const statusLabel = recognition.status === 'BROUILLON'
      ? 'BROUILLON - EN ATTENTE DE VALIDATION'
      : recognition.status === 'JUSTIFIEE'
        ? 'JUSTIFIÉE'
        : 'VALIDÉE PAR LE PATRON'

    document.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a')
      .text('GRAND LUIX SARL', { align: 'center' })
    document.moveDown(0.4)
    document.fontSize(15).text('RECONNAISSANCE DE DETTE', { align: 'center' })
    document.moveDown(0.5)
    document.font('Helvetica').fontSize(9).fillColor('#475569')
      .text(`Référence : ${recognition.reference}`, { align: 'center' })
      .text(statusLabel, { align: 'center' })
    document.moveDown(2)

    document.font('Helvetica').fontSize(12).fillColor('#0f172a')
      .text(`Fait le ${formatDate(recognition.recognitionDate)}.`)
    if (recognition.dueDate) {
      document.text(`Date d’échéance convenue : ${formatDate(recognition.dueDate)}.`)
    }
    document.moveDown()
    document.text(
      `Je soussigné(e), ${recognition.debtorName}, reconnais devoir à ${recognition.creditorName} la somme de ${formatFCFA(recognition.amount)} (${amountInWordsFCFA(recognition.amount)}).`,
      { align: 'justify' }
    )
    document.moveDown()
    document.text(`Motif de la dette : ${recognition.purpose}`, { align: 'justify' })
    if (recognition.notes) {
      document.moveDown()
      document.text(`Observations : ${recognition.notes}`, { align: 'justify' })
    }
    document.moveDown()
    document.text(
      'Je m’engage à régler cette dette selon les modalités convenues avec le créancier. Le présent document constate la dette et ne vaut quittance qu’après règlement intégral.',
      { align: 'justify' }
    )
    document.moveDown(3)
    document.text(`Établi en deux exemplaires à ____________________, le ____ / ____ / ______.`)
    document.moveDown(3)

    if (document.y + 100 > document.page.height - document.page.margins.bottom) {
      document.addPage()
    }
    const signatureY = document.y
    const columnGap = 42
    const columnWidth = (document.page.width - document.page.margins.left - document.page.margins.right - columnGap) / 2
    const leftX = document.page.margins.left
    const rightX = leftX + columnWidth + columnGap

    document.font('Helvetica-Bold').fontSize(10)
      .text('Le débiteur', leftX, signatureY, { width: columnWidth, align: 'center' })
      .text('Le créancier', rightX, signatureY, { width: columnWidth, align: 'center' })
    document.moveTo(leftX + 12, signatureY + 72).lineTo(leftX + columnWidth - 12, signatureY + 72).stroke('#94a3b8')
    document.moveTo(rightX + 12, signatureY + 72).lineTo(rightX + columnWidth - 12, signatureY + 72).stroke('#94a3b8')
    document.font('Helvetica').fontSize(9).fillColor('#475569')
      .text(recognition.debtorName, leftX, signatureY + 78, { width: columnWidth, align: 'center' })
      .text(recognition.creditorName, rightX, signatureY + 78, { width: columnWidth, align: 'center' })

    document.end()
  })
}
