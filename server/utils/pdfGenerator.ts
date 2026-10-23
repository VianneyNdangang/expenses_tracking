import PDFDocument from 'pdfkit'
import { formatFCFA, amountInWordsFCFA } from '../../shared/currency'

export interface CommitmentPdfData {
  type?: 'MATERIEL' | 'PRET' | 'SALAIRE' | 'AUTRE'
  letterNumber: string
  date: Date | string
  city: string
  templateVersion: number
  purpose: string
  amountRequested: number
  amountApproved: number
  workerSnapshot: {
    civility: string
    fullName: string
    cniMasked: string
    phoneMasked: string
  }
  items?: Array<{
    name: string
    unit: string
    quantity: number
    unitPriceDeclared: number
    totalPriceDeclared: number
  }>
  witnesses?: Array<{
    civility: string
    fullName: string
    cniMasked: string
  }>
  settings: {
    patronCivility: string
    patronName: string
    patronAddress: string
    patronPhone: string
    justificationDelayDays: number
  }
}

export function generateCommitmentPdf(data: CommitmentPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Lettre d'Engagement ${data.letterNumber}`,
          Author: data.settings.patronName,
          Subject: 'Décharge financière et engagement formel'
        }
      })

      const buffers: Buffer[] = []
      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      const effectiveAmount = data.amountApproved > 0 ? data.amountApproved : data.amountRequested
      const amountInWords = amountInWordsFCFA(effectiveAmount)
      const formattedDate = new Date(data.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const accord = data.workerSnapshot.civility === 'Mme' || data.workerSnapshot.civility === 'Mlle' ? 'soussignée' : 'soussigné'
      const commitmentType = data.type || 'MATERIEL'

      const left = 36
      const contentWidth = 523

      // --- 1. En-tête officiel ---
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569')
        .text('ÉTABLISSEMENTS & DIRECTION GÉNÉRALE', left, 36)

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a')
        .text(data.settings.patronName.toUpperCase(), left, 47)

      doc.fontSize(8).font('Helvetica').fillColor('#64748b')
        .text(`${data.settings.patronAddress} • Tél : ${data.settings.patronPhone}`, left, 63)

      // Bloc Référence et Date à droite
      doc.rect(400, 34, 159, 24).fillAndStroke('#f1f5f9', '#cbd5e1')
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a')
        .text(`RÉF : ${data.letterNumber}`, 405, 41, { width: 150, align: 'center' })

      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b')
        .text(`Date : ${formattedDate} • Ville : ${data.city}`, 360, 63, { width: 199, align: 'right' })

      // Séparateur
      doc.moveTo(left, 78).lineTo(left + contentWidth, 78).lineWidth(1).strokeColor('#0f172a').stroke()

      // --- 2. Titre encadré adapté au type ---
      let docTitle = "LETTRE D'ENGAGEMENT & D'ACHAT DE MATÉRIEL"
      if (commitmentType === 'PRET') {
        docTitle = "RECONNAISSANCE DE DETTE & ENGAGEMENT DE REMBOURSEMENT"
      } else if (commitmentType === 'SALAIRE') {
        docTitle = "DÉCHARGE DE PAIEMENT DE SALAIRE & RÉMUNÉRATION"
      } else if (commitmentType === 'AUTRE') {
        docTitle = "LETTRE D'ENGAGEMENT & DE DÉCHARGE FINANCIÈRE"
      }

      doc.rect(left + 15, 87, contentWidth - 30, 26).lineWidth(1).strokeColor('#0f172a').stroke()
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a')
        .text(docTitle, left + 15, 94.5, {
          width: contentWidth - 30,
          align: 'center'
        })

      // --- 3. Paragraphe de reconnaissance (texte justifié et lisible) ---
      const introY = 124
      const introText = `Je ${accord} ${data.workerSnapshot.civility} ${data.workerSnapshot.fullName}, titulaire de la CNI n° ${data.workerSnapshot.cniMasked}, joignable au ${data.workerSnapshot.phoneMasked}, reconnais formellement avoir reçu de la direction (${data.settings.patronCivility} ${data.settings.patronName}) la somme arrêtée à :`

      doc.fontSize(9).font('Helvetica').fillColor('#0f172a')
        .text(introText, left, introY, {
          width: contentWidth,
          align: 'justify',
          lineGap: 2.5
        })

      // Encadré Montant bien visible
      const amountBoxY = doc.y + 7
      doc.rect(left, amountBoxY, contentWidth, 36).fillAndStroke('#f8fafc', '#e2e8f0')
      doc.rect(left, amountBoxY, 4, 36).fill('#0f172a')

      doc.fontSize(12.5).font('Helvetica-Bold').fillColor('#0f172a')
        .text(formatFCFA(effectiveAmount), left + 14, amountBoxY + 5)
      doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#334155')
        .text(`(En toutes lettres : ${amountInWords})`, left + 14, amountBoxY + 21, { width: contentWidth - 28, lineGap: 1 })

      // Motif explicite
      const purposeLabelY = amountBoxY + 44
      let motifIntro = 'remise pour le motif exclusif d’achat et d’acquisition :'
      if (commitmentType === 'PRET') {
        motifIntro = 'octroyée à titre de prêt / avance financière remboursable pour :'
      } else if (commitmentType === 'SALAIRE') {
        motifIntro = 'versée au titre de salaire / prestation de travail pour :'
      } else if (commitmentType === 'AUTRE') {
        motifIntro = 'mise à disposition pour l’opération suivante :'
      }

      doc.fontSize(8.5).font('Helvetica').fillColor('#0f172a')
        .text(motifIntro, left, purposeLabelY)

      const purposeBoxY = purposeLabelY + 13
      doc.rect(left, purposeBoxY, contentWidth, 24).fillAndStroke('#f8fafc', '#cbd5e1')
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a')
        .text(`« ${data.purpose} »`, left + 8, purposeBoxY + 6, {
          width: contentWidth - 16,
          lineGap: 1.5,
          align: 'left'
        })

      let nextSectionY = purposeBoxY + 34

      // --- 4. Section Détail : Tableau d'articles OU Encadré Synthétique ---
      const hasItems = Array.isArray(data.items) && data.items.length > 0

      if (hasItems) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a')
          .text("DÉTAIL DES ACHATS ET FOURNITURES AUTORISÉS :", left, nextSectionY)

        const colN = left
        const colName = left + 24
        const colUnit = left + 250
        const colQty = left + 295
        const colPrice = left + 345
        const colTotal = left + 430

        const thY = nextSectionY + 12
        doc.rect(left, thY, contentWidth, 16).fillAndStroke('#f1f5f9', '#0f172a')

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a')
        doc.text('N°', colN + 2, thY + 4, { width: 20, align: 'center' })
        doc.text("Désignation de l'article", colName + 4, thY + 4, { width: 220 })
        doc.text('Unité', colUnit, thY + 4, { width: 40, align: 'center' })
        doc.text('Qté', colQty, thY + 4, { width: 45, align: 'right' })
        doc.text('Prix Unit. (FCFA)', colPrice, thY + 4, { width: 80, align: 'right' })
        doc.text('Total (FCFA)', colTotal, thY + 4, { width: 88, align: 'right' })

        let rowY = thY + 16
        const maxItems = Math.min(data.items!.length, 10)
        for (let i = 0; i < maxItems; i++) {
          const item = data.items![i]
          const rowH = 15
          if (i % 2 === 1) {
            doc.rect(left, rowY, contentWidth, rowH).fill('#f8fafc')
          }
          doc.rect(left, rowY, contentWidth, rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke()

          doc.fontSize(7.5).font('Helvetica').fillColor('#0f172a')
          doc.text(String(i + 1), colN + 2, rowY + 3.5, { width: 20, align: 'center' })
          doc.text(item.name, colName + 4, rowY + 3.5, { width: 220, truncate: true })
          doc.text(item.unit, colUnit, rowY + 3.5, { width: 40, align: 'center' })
          doc.text(String(item.quantity), colQty, rowY + 3.5, { width: 45, align: 'right' })
          doc.text(formatFCFA(item.unitPriceDeclared).replace(' FCFA', ''), colPrice, rowY + 3.5, { width: 80, align: 'right' })
          doc.font('Helvetica-Bold')
          doc.text(formatFCFA(item.totalPriceDeclared).replace(' FCFA', ''), colTotal, rowY + 3.5, { width: 88, align: 'right' })

          rowY += rowH
        }

        // Total tableau
        doc.rect(left, rowY, contentWidth, 18).fillAndStroke('#f1f5f9', '#0f172a')
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a')
        doc.text('MONTANT TOTAL VALISÉ :', left + 10, rowY + 4.5, { width: 410, align: 'right' })
        doc.text(formatFCFA(effectiveAmount), colTotal, rowY + 4.5, { width: 88, align: 'right' })

        nextSectionY = rowY + 26
      } else {
        // Pas d'articles : Encadré synthétique et aéré de l'opération
        const boxH = 44
        doc.rect(left, nextSectionY, contentWidth, boxH).fillAndStroke('#f8fafc', '#cbd5e1')
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a')
          .text("MODALITÉS ET CADRE FINANCIER DE L'OPÉRATION :", left + 10, nextSectionY + 6)

        let detailText = `Opération validée sans liste d'articles. Montant net convenu : ${formatFCFA(effectiveAmount)}. `
        if (commitmentType === 'PRET') {
          detailText += "Fonds décaissés à titre d'emprunt remboursable, consenti selon les conditions arrêtées avec l'employeur."
        } else if (commitmentType === 'SALAIRE') {
          detailText += "Règlement effectué au titre de la rémunération du travail, valant quittance libératoire pour les prestations fournies."
        } else {
          detailText += "Fonds mis à disposition pour couverture des frais généraux ou missions ponctuelles approuvées par la direction."
        }

        doc.fontSize(7.5).font('Helvetica').fillColor('#334155')
          .text(detailText, left + 10, nextSectionY + 18, {
            width: contentWidth - 20,
            align: 'justify',
            lineGap: 2
          })

        nextSectionY = nextSectionY + boxH + 14
      }

      // --- 5. Clauses juridiques adaptées et justifiées ---
      const delayDays = data.settings.justificationDelayDays || 7
      let clausesTitle = "ENGAGEMENTS STRICTS DE L'EMPLOYÉ :"
      let clauses: string[] = []

      if (commitmentType === 'PRET') {
        clausesTitle = "CONDITIONS & ENGAGEMENTS DE REMBOURSEMENT DU PRÊT :"
        clauses = [
          "1. Reconnaissance expresse : Je reconnais formellement avoir reçu à titre de prêt d'honneur ou avance financière remboursable la somme mentionnée ci-dessus accordée par la direction.",
          "2. Modalités de remboursement : Je m'engage expressément à restituer l'intégralité de cette somme selon les échéances et modalités convenues avec la direction, ou par retenue directe autorisée sur mes émoluments.",
          "3. Priorité d'apurement : Je reconnais qu'aucune autre facilité de caisse ou nouveau prêt ne pourra m'être consenti avant l'apurement intégral et effectif de la présente créance.",
          "4. Exigibilité immédiate : En cas de défaillance, de litige ou de cessation d'activité pour quelque motif que ce soit, le solde restant dû devient immédiatement exigible dans son intégralité."
        ]
      } else if (commitmentType === 'SALAIRE') {
        clausesTitle = "ATTESTATION DE PERCEPTION & DÉCHARGE LIBÉRATOIRE :"
        clauses = [
          "1. Perception effective : Je reconnais avoir perçu l'intégralité de la somme susmentionnée au titre de mon salaire, avance ou rémunération pour les prestations et périodes convenues.",
          "2. Décharge complète : Par la présente signature, j'accorde à la direction pleine et entière décharge financière, ce versement valant quittance libératoire pour ladite période.",
          "3. Conformité des prestations : J'atteste que les travaux, heures et tâches ayant motivé ce règlement ont été fidèlement exécutés conformément aux accords et directives reçues.",
          "4. Engagement professionnel : Je m'engage à continuer d'exercer mes fonctions avec probité, assiduité et dans le respect strict des intérêts et de la confidentialité de l'établissement."
        ]
      } else if (commitmentType === 'AUTRE') {
        clausesTitle = "ENGAGEMENTS & CONDITIONS D'UTILISATION DES FONDS :"
        clauses = [
          "1. Affectation exclusive : La somme allouée est strictement réservée à la réalisation du motif approuvé ci-dessus. Tout usage détourné à d'autres fins personnelles est formellement interdit.",
          `2. Justification intégrale : Je m'engage à produire l'ensemble des reçus réguliers, factures et pièces probantes dans un délai maximal de ${delayDays} jours ouvrés à compter de la réception des fonds.`,
          "3. Restitution du reliquat : Tout reliquat budgétaire non dépensé doit être intégralement et immédiatement reversé en caisse dès la présentation du décompte justificatif.",
          "4. Responsabilité civile et pénale : En cas de non-justification, perte injustifiée ou détournement, j'en réponds personnellement et autorise toute retenue compensatoire sur mes droits."
        ]
      } else {
        // MATERIEL
        clausesTitle = "ENGAGEMENTS STRICTS DE L'EMPLOYÉ :"
        clauses = [
          "1. Affectation exclusive : La somme allouée est destinée exclusivement à l'acquisition des articles autorisés ci-dessus. Tout usage détourné à d'autres fins personnelles ou non conformes est formellement prohibé.",
          `2. Justificatifs et Factures : Je m'engage à fournir l'intégralité des factures régulières, reçus et décharges dans un délai impératif de ${delayDays} jours ouvrés à compter de la réception des fonds.`,
          "3. Restitution du Reliquat : Tout reliquat budgétaire non dépensé doit être intégralement et immédiatement restitué en caisse à la présentation du bilan justificatif.",
          "4. Responsabilité : En cas de perte, détournement, absence de justificatifs ou dépassement non autorisé, j'en réponds personnellement sur le plan civil et pénal, et autorise toute retenue légale."
        ]
      }

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a')
        .text(clausesTitle, left, nextSectionY)

      let cY = nextSectionY + 11
      doc.fontSize(6.8).font('Helvetica').fillColor('#1e293b')
      for (const clause of clauses) {
        doc.text(clause, left, cY, {
          width: contentWidth,
          align: 'justify',
          lineGap: 1.8
        })
        cY = doc.y + 3.5
      }

      // Fait à ... le ...
      const placeY = cY + 3
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a')
        .text(`Fait à ${data.city}, le ${formattedDate}`, left, placeY, { width: contentWidth, align: 'right' })

      // --- 6. Bloc des Signatures (4 boîtes alignées en bas) ---
      const sigY = placeY + 14
      doc.moveTo(left, sigY - 3).lineTo(left + contentWidth, sigY - 3).lineWidth(0.5).strokeColor('#cbd5e1').stroke()

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a')
        .text('BLOC DES SIGNATURES & DÉCHARGE FORMELLE', left, sigY, { width: contentWidth, align: 'center' })

      const boxW = (contentWidth - 18) / 4
      const boxH = 74
      const boxesY = sigY + 11

      // Boîte 1 : L'Employé
      doc.rect(left, boxesY, boxW, boxH).lineWidth(1).strokeColor('#0f172a').stroke()
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a').text("L'EMPLOYÉ", left, boxesY + 5, { width: boxW, align: 'center' })
      doc.fontSize(6).font('Helvetica-Oblique').fillColor('#64748b').text('Mention "Lu et approuvé"', left, boxesY + 15, { width: boxW, align: 'center' })
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#0f172a').text(`${data.workerSnapshot.civility} ${data.workerSnapshot.fullName}`, left + 3, boxesY + 25, { width: boxW - 6, align: 'center', truncate: true })
      doc.moveTo(left + 6, boxesY + 58).lineTo(left + boxW - 6, boxesY + 58).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#94a3b8').stroke()
      doc.undash()
      doc.fontSize(5.5).font('Helvetica').fillColor('#94a3b8').text('Signature & Date', left, boxesY + 61, { width: boxW, align: 'center' })

      // Boîte 2 : La Direction
      const b2X = left + boxW + 6
      doc.rect(b2X, boxesY, boxW, boxH).fillAndStroke('#f8fafc', '#0f172a')
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a').text('LA DIRECTION', b2X, boxesY + 5, { width: boxW, align: 'center' })
      doc.fontSize(6).font('Helvetica-Oblique').fillColor('#64748b').text('Bon pour accord', b2X, boxesY + 15, { width: boxW, align: 'center' })
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#0f172a').text(data.settings.patronName, b2X + 3, boxesY + 25, { width: boxW - 6, align: 'center', truncate: true })
      doc.moveTo(b2X + 6, boxesY + 58).lineTo(b2X + boxW - 6, boxesY + 58).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#94a3b8').stroke()
      doc.undash()
      doc.fontSize(5.5).font('Helvetica').fillColor('#94a3b8').text('Signature & Cachet', b2X, boxesY + 61, { width: boxW, align: 'center' })

      // Boîte 3 : Témoin 1
      const b3X = left + (boxW + 6) * 2
      const t1 = data.witnesses?.[0]
      doc.rect(b3X, boxesY, boxW, boxH).lineWidth(1).strokeColor('#0f172a').stroke()
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a').text('TÉMOIN 1', b3X, boxesY + 5, { width: boxW, align: 'center' })
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#0f172a').text(t1?.fullName || 'Nom & Prénom', b3X + 3, boxesY + 22, { width: boxW - 6, align: 'center', truncate: true })
      doc.fontSize(5.5).font('Helvetica').fillColor('#64748b').text(`CNI : ${t1?.cniMasked || '••••••••'}`, b3X, boxesY + 34, { width: boxW, align: 'center' })
      doc.moveTo(b3X + 6, boxesY + 58).lineTo(b3X + boxW - 6, boxesY + 58).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#94a3b8').stroke()
      doc.undash()
      doc.fontSize(5.5).font('Helvetica').fillColor('#94a3b8').text('Signature', b3X, boxesY + 61, { width: boxW, align: 'center' })

      // Boîte 4 : Témoin 2
      const b4X = left + (boxW + 6) * 3
      const t2 = data.witnesses?.[1]
      doc.rect(b4X, boxesY, boxW, boxH).lineWidth(1).strokeColor('#0f172a').stroke()
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a').text('TÉMOIN 2', b4X, boxesY + 5, { width: boxW, align: 'center' })
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#0f172a').text(t2?.fullName || 'Nom & Prénom', b4X + 3, boxesY + 22, { width: boxW - 6, align: 'center', truncate: true })
      doc.fontSize(5.5).font('Helvetica').fillColor('#64748b').text(`CNI : ${t2?.cniMasked || '••••••••'}`, b4X, boxesY + 34, { width: boxW, align: 'center' })
      doc.moveTo(b4X + 6, boxesY + 58).lineTo(b4X + boxW - 6, boxesY + 58).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#94a3b8').stroke()
      doc.undash()
      doc.fontSize(5.5).font('Helvetica').fillColor('#94a3b8').text('Signature', b4X, boxesY + 61, { width: boxW, align: 'center' })

      doc.end()
    } catch (e) {
      reject(e)
    }
  })
}
