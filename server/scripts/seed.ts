import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import { connectToDatabase } from '../utils/db'
import { hashPassword, encryptField } from '../utils/crypto'
import { User } from '../models/User'
import { Settings } from '../models/Settings'
import { LetterTemplate, DEFAULT_LETTER_TEMPLATE } from '../models/LetterTemplate'
import { Item } from '../models/Item'
import { ItemPrice } from '../models/ItemPrice'
import { Worker } from '../models/Worker'
import { Witness } from '../models/Witness'
import { Commitment } from '../models/Commitment'
import { Payment } from '../models/Payment'
import { Justification } from '../models/Justification'
import { Counter } from '../models/Counter'
import { evaluatePriceDifference } from '../../shared/priceComparison'

async function runSeed() {
  console.log('🌱 Démarrage du script de seed...')
  await connectToDatabase()

  // 1. Initialisation des 3 rôles obligatoires (Patron, Secrétaire, Technicien)
  const defaultPassword = process.env.PATRON_INITIAL_PASSWORD || 'Patron@2026!'
  const existingPatron = await User.findOne({ username: 'patron' })
  let patronUser = existingPatron

  if (!existingPatron) {
    const passwordHash = await hashPassword(defaultPassword)
    patronUser = await User.create({
      username: 'patron',
      name: 'M. Abdouraman',
      role: 'PATRON',
      passwordHash,
      failedLoginAttempts: 0
    })
    console.log(`✅ Compte patron créé : identifiant "patron", mot de passe "${defaultPassword}"`)
  } else {
    if (!existingPatron.role) {
      existingPatron.role = 'PATRON'
      await existingPatron.save()
    }
    console.log('ℹ️ Compte patron déjà existant (rôle PATRON validé).')
  }

  // Secrétaire
  const existingSecretaire = await User.findOne({ username: 'secretaire' })
  if (!existingSecretaire) {
    const secPass = 'Secretaire@2026!'
    const secHash = await hashPassword(secPass)
    await User.create({
      username: 'secretaire',
      name: 'Mme Ngo Biboum (Secrétaire)',
      role: 'SECRETAIRE',
      passwordHash: secHash,
      failedLoginAttempts: 0
    })
    console.log(`✅ Compte secrétaire créé : identifiant "secretaire", mot de passe "${secPass}"`)
  } else {
    console.log('ℹ️ Compte secrétaire déjà existant.')
  }

  // Technicien
  const existingTechnicien = await User.findOne({ username: 'technicien' })
  if (!existingTechnicien) {
    const techPass = 'Technicien@2026!'
    const techHash = await hashPassword(techPass)
    await User.create({
      username: 'technicien',
      name: 'M. Kamga Jean (Technicien)',
      role: 'TECHNICIEN',
      passwordHash: techHash,
      failedLoginAttempts: 0
    })
    console.log(`✅ Compte technicien créé : identifiant "technicien", mot de passe "${techPass}"`)
  } else {
    console.log('ℹ️ Compte technicien déjà existant.')
  }

  // 2. Paramètres généraux
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({
      patronCivility: 'M.',
      patronName: 'M. Abdouraman',
      patronPhone: '+237 699 00 11 22',
      patronAddress: 'Quartier Bastos, Yaoundé, Cameroun',
      defaultCity: 'Yaoundé',
      justificationDelayDays: 7,
      toleranceThreshold: 10,
      suspectThreshold: 20
    })
    console.log('✅ Paramètres initiaux créés.')
  }

  // 3. Modèle de lettre d'engagement
  let template = await LetterTemplate.findOne({ version: 1 })
  if (!template) {
    template = await LetterTemplate.create({
      version: 1,
      content: DEFAULT_LETTER_TEMPLATE,
      isActive: true
    })
    console.log('✅ Modèle de lettre type v1 créé.')
  }

  // 4. Articles et Historique de prix
  const itemsCount = await Item.countDocuments()
  if (itemsCount === 0) {
    console.log('📦 Création des articles de référence et de leurs prix...')
    const itemsData = [
      { name: 'Ciment CPJ 35 (Sac de 50kg)', unit: 'Sac', price: 4900, tolerance: 10 },
      { name: 'Fer à béton 12mm (Barre de 12m)', unit: 'Barre', price: 8500, tolerance: 8 },
      { name: 'Fer à béton 10mm (Barre de 12m)', unit: 'Barre', price: 6200, tolerance: 8 },
      { name: 'Sable de rivière fin (Camion 10m³)', unit: 'Camion', price: 85000, tolerance: 12 },
      { name: 'Gravier concassé 15/25 (Camion 10m³)', unit: 'Camion', price: 130000, tolerance: 10 },
      { name: 'Carburant Gasoil (Fût de 200L)', unit: 'Fût', price: 175000, tolerance: 5 },
      { name: 'Peinture Blanche Acrylique 20L', unit: 'Bidon', price: 32000, tolerance: 10 },
      { name: 'Câble cuivre 2.5mm² (Rouleau 100m)', unit: 'Rouleau', price: 28500, tolerance: 10 },
      { name: 'Tuyau PVC évacuation 110 (Longueur 4m)', unit: 'Pièce', price: 7800, tolerance: 10 }
    ]

    for (const data of itemsData) {
      const item = await Item.create({
        name: data.name,
        unit: data.unit,
        notes: 'Référence standard marché'
      })

      await ItemPrice.create({
        itemId: item._id,
        referencePrice: data.price,
        tolerancePercent: data.tolerance,
        startDate: new Date('2026-01-01')
      })
    }
  }

  // 5. Employés (Données chiffrées AES-256-GCM)
  const workersCount = await Worker.countDocuments()
  let workers: any[] = []
  if (workersCount === 0) {
    console.log('👷 Création des employés de démonstration (CNI et téléphones chiffrés)...')
    const workersData = [
      { civility: 'M.', fullName: 'Kamga Jean-Pierre', cni: '1092837465', phone: '+237 677 12 34 56' },
      { civility: 'Mme', fullName: 'Ngo Biboum Marie', cni: '2019485736', phone: '+237 699 45 67 89' },
      { civility: 'M.', fullName: 'Bello Oumarou', cni: '1183749201', phone: '+237 655 98 76 54' }
    ]

    for (const w of workersData) {
      const worker = await Worker.create({
        civility: w.civility,
        fullName: w.fullName,
        cniEncrypted: encryptField(w.cni),
        phoneEncrypted: encryptField(w.phone)
      })
      workers.push(worker)
    }
  } else {
    workers = await Worker.find()
  }

  // 6. Témoins (Données chiffrées AES-256-GCM)
  const witnessesCount = await Witness.countDocuments()
  let witnesses: any[] = []
  if (witnessesCount === 0) {
    console.log('👥 Création des témoins de démonstration...')
    const witnessesData = [
      { civility: 'M.', fullName: 'Tchuente Paulin', cni: '3049581726', phone: '+237 670 11 22 33' },
      { civility: 'M.', fullName: 'Moussa Ibrahim', cni: '4091827364', phone: '+237 690 33 44 55' }
    ]

    for (const wt of witnessesData) {
      const witness = await Witness.create({
        civility: wt.civility,
        fullName: wt.fullName,
        cniEncrypted: encryptField(wt.cni),
        phoneEncrypted: encryptField(wt.phone)
      })
      witnesses.push(witness)
    }
  } else {
    witnesses = await Witness.find()
  }

  // 7. Engagements de démonstration (différents statuts)
  const commitmentsCount = await Commitment.countDocuments()
  if (commitmentsCount === 0) {
    console.log('📋 Création des engagements types (Demandé, Accepté, Payé, Justifié, Refusé)...')
    const allItems = await Item.find()
    const allPrices = await ItemPrice.find({ endDate: null })
    const priceMap = new Map(allPrices.map(p => [p.itemId.toString(), p]))

    const getLine = (index: number, quantity: number, declaredPrice: number) => {
      const it = allItems[index]
      const pr = priceMap.get(it._id.toString()) || { referencePrice: declaredPrice, tolerancePercent: 10 }
      const evalRes = evaluatePriceDifference(declaredPrice, pr.referencePrice, pr.tolerancePercent, pr.tolerancePercent * 2)

      return {
        itemId: it._id,
        name: it.name,
        unit: it.unit,
        quantity,
        unitPriceDeclared: declaredPrice,
        totalPriceDeclared: quantity * declaredPrice,
        referenceUnitPrice: pr.referencePrice,
        tolerancePercent: pr.tolerancePercent,
        differenceValue: evalRes.differenceValue,
        differencePercent: evalRes.differencePercent,
        status: evalRes.status
      }
    }

    const counter = await Counter.findByIdAndUpdate('commitment_number', { $set: { seq: 100 } }, { upsert: true, new: true })

    // Engagement 1 : "Demandé" (En attente d'approbation patron)
    const lines1 = [
      getLine(0, 50, 5000), // Ciment (4900 ref -> 5000 toléré)
      getLine(1, 20, 8500)  // Fer (8500 ref -> 8500 conforme)
    ]
    const amountReq1 = lines1.reduce((sum, l) => sum + l.totalPriceDeclared, 0)
    await Commitment.create({
      letterNumber: 'ENG-2026-0101',
      seq: 101,
      workerId: workers[0]._id,
      workerSnapshot: {
        civility: workers[0].civility,
        fullName: workers[0].fullName,
        cniMasked: '•••• 7465',
        phoneMasked: '•••• 3456'
      },
      purpose: 'Achat de ciment et fer pour coffrage dalle magasin',
      city: 'Yaoundé',
      date: new Date('2026-10-20'),
      templateVersion: 1,
      witnesses: [{
        witnessId: witnesses[0]._id,
        civility: witnesses[0].civility,
        fullName: witnesses[0].fullName,
        cniMasked: '•••• 1726',
        phoneMasked: '•••• 2233'
      }],
      items: lines1,
      amountRequested: amountReq1,
      amountApproved: 0,
      status: 'Demandé',
      notes: 'Demande urgente formulée par le chef d’équipe'
    })

    // Engagement 2 : "Accepté" (Accordé, prêt pour impression lettre et paiement)
    const lines2 = [
      getLine(3, 2, 85000), // Sable
      getLine(4, 2, 130000) // Gravier
    ]
    const amountReq2 = lines2.reduce((sum, l) => sum + l.totalPriceDeclared, 0)
    await Commitment.create({
      letterNumber: 'ENG-2026-0102',
      seq: 102,
      workerId: workers[1]._id,
      workerSnapshot: {
        civility: workers[1].civility,
        fullName: workers[1].fullName,
        cniMasked: '•••• 5736',
        phoneMasked: '•••• 6789'
      },
      purpose: 'Approvisionnement agrégats pour coulage béton',
      city: 'Yaoundé',
      date: new Date('2026-10-21'),
      templateVersion: 1,
      witnesses: [
        {
          witnessId: witnesses[0]._id,
          civility: witnesses[0].civility,
          fullName: witnesses[0].fullName,
          cniMasked: '•••• 1726',
          phoneMasked: '•••• 2233'
        },
        {
          witnessId: witnesses[1]._id,
          civility: witnesses[1].civility,
          fullName: witnesses[1].fullName,
          cniMasked: '•••• 7364',
          phoneMasked: '•••• 4455'
        }
      ],
      items: lines2,
      amountRequested: amountReq2,
      amountApproved: amountReq2,
      status: 'Accepté',
      notes: 'Accordé en totalité. Lettre d’engagement imprimée à signer.'
    })

    // Engagement 3 : "Payé" (Argent décaissé, délai en cours pour les reçus)
    const lines3 = [
      getLine(5, 1, 175000) // Gasoil
    ]
    const amountReq3 = lines3.reduce((sum, l) => sum + l.totalPriceDeclared, 0)
    const comm3 = await Commitment.create({
      letterNumber: 'ENG-2026-0103',
      seq: 103,
      workerId: workers[2]._id,
      workerSnapshot: {
        civility: workers[2].civility,
        fullName: workers[2].fullName,
        cniMasked: '•••• 9201',
        phoneMasked: '•••• 7654'
      },
      purpose: 'Approvisionnement carburant groupe électrogène et camions',
      city: 'Yaoundé',
      date: new Date('2026-10-18'),
      templateVersion: 1,
      witnesses: [{
        witnessId: witnesses[0]._id,
        civility: witnesses[0].civility,
        fullName: witnesses[0].fullName,
        cniMasked: '•••• 1726',
        phoneMasked: '•••• 2233'
      }],
      items: lines3,
      amountRequested: amountReq3,
      amountApproved: amountReq3,
      status: 'Payé'
    })

    await Payment.create({
      commitmentId: comm3._id,
      amount: amountReq3,
      date: new Date('2026-10-18'),
      method: 'Espèces',
      reference: 'RECU-CAISSE-089',
      notes: 'Fonds remis en mains propres après signature de la lettre'
    })

    // Engagement 4 : "Justifié" (Dépense réelle effectuée et reliquat retourné)
    const lines4 = [
      getLine(6, 4, 32000), // Peinture
      getLine(7, 2, 28500)  // Câbles
    ]
    const amountReq4 = lines4.reduce((sum, l) => sum + l.totalPriceDeclared, 0) // 128000 + 57000 = 185000
    const comm4 = await Commitment.create({
      letterNumber: 'ENG-2026-0104',
      seq: 104,
      workerId: workers[0]._id,
      workerSnapshot: {
        civility: workers[0].civility,
        fullName: workers[0].fullName,
        cniMasked: '•••• 7465',
        phoneMasked: '•••• 3456'
      },
      purpose: 'Peinture et réfection électrique des bureaux administratifs',
      city: 'Yaoundé',
      date: new Date('2026-10-10'),
      templateVersion: 1,
      witnesses: [{
        witnessId: witnesses[1]._id,
        civility: witnesses[1].civility,
        fullName: witnesses[1].fullName,
        cniMasked: '•••• 7364',
        phoneMasked: '•••• 4455'
      }],
      items: lines4,
      amountRequested: amountReq4,
      amountApproved: amountReq4,
      status: 'Justifié'
    })

    await Payment.create({
      commitmentId: comm4._id,
      amount: amountReq4,
      date: new Date('2026-10-10'),
      method: 'Mobile Money',
      reference: 'OM-20261010-89382',
      notes: 'Virement Orange Money'
    })

    await Justification.create({
      commitmentId: comm4._id,
      amountSpent: 180000,
      balance: 5000, // Reliquat de 5000 FCFA restitué
      notes: 'Factures présentées et conformes. Reliquat de 5 000 FCFA versé en caisse.',
      date: new Date('2026-10-14'),
      attachments: [{
        name: 'Facture_Quincaillerie_Bastos.pdf',
        url: '/uploads/demo-facture.pdf',
        size: 145020,
        mimeType: 'application/pdf'
      }]
    })

    // Engagement 5 : "Refusé"
    const lines5 = [
      getLine(8, 10, 15000) // Tuyaux PVC à 15000 au lieu de 7800 (+92% suspect)
    ]
    const amountReq5 = lines5.reduce((sum, l) => sum + l.totalPriceDeclared, 0)
    await Commitment.create({
      letterNumber: 'ENG-2026-0105',
      seq: 105,
      workerId: workers[2]._id,
      workerSnapshot: {
        civility: workers[2].civility,
        fullName: workers[2].fullName,
        cniMasked: '•••• 9201',
        phoneMasked: '•••• 7654'
      },
      purpose: 'Tuyauterie d’assainissement supplémentaire',
      city: 'Yaoundé',
      date: new Date('2026-10-15'),
      templateVersion: 1,
      items: lines5,
      amountRequested: amountReq5,
      amountApproved: 0,
      status: 'Refusé',
      refusalReason: 'Prix unitaire déclaré exorbitant (15 000 FCFA au lieu de 7 800 FCFA référence, soit +92% d’écart suspect). Devis non justifié.'
    })
  }

  console.log('✨ Base de données initialisée avec succès !')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Erreur lors de l’exécution du seed :', err)
  process.exit(1)
})
