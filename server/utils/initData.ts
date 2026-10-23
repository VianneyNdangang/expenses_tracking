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
import { hashPassword, encryptField } from './crypto'
import { evaluatePriceDifference } from '../../shared/priceComparison'

let isSeeding = false

export async function ensureInitialData() {
  if (isSeeding) return
  isSeeding = true

  try {
    // 1. Initialisation des 3 rôles obligatoires : Patron, Secrétaire, Technicien
    const existingPatron = await User.findOne({ username: 'patron' })
    if (!existingPatron) {
      const passwordHash = await hashPassword('Patron@2026!')
      await User.create({
        username: 'patron',
        name: 'M. Abdouraman',
        role: 'PATRON',
        passwordHash,
        failedLoginAttempts: 0
      })
    } else if (!existingPatron.role) {
      existingPatron.role = 'PATRON'
      await existingPatron.save()
    }

    const existingSecretaire = await User.findOne({ username: 'secretaire' })
    if (!existingSecretaire) {
      const passwordHash = await hashPassword('Secretaire@2026!')
      await User.create({
        username: 'secretaire',
        name: 'Mme Ngo Biboum (Secrétaire)',
        role: 'SECRETAIRE',
        passwordHash,
        failedLoginAttempts: 0
      })
    }

    const existingTechnicien = await User.findOne({ username: 'technicien' })
    if (!existingTechnicien) {
      const passwordHash = await hashPassword('Technicien@2026!')
      await User.create({
        username: 'technicien',
        name: 'M. Kamga Jean (Technicien)',
        role: 'TECHNICIEN',
        passwordHash,
        failedLoginAttempts: 0
      })
    }

    const settingsCount = await Settings.countDocuments()
    if (settingsCount > 0) {
      return
    }

    // 2. Paramètres
    await Settings.create({
      patronCivility: 'M.',
      patronName: 'M. Abdouraman',
      patronPhone: '+237 699 00 11 22',
      patronAddress: 'Quartier Bastos, Yaoundé, Cameroun',
      defaultCity: 'Yaoundé',
      justificationDelayDays: 7,
      toleranceThreshold: 10,
      suspectThreshold: 20
    })

    // 3. Modèle de lettre
    await LetterTemplate.create({
      version: 1,
      content: DEFAULT_LETTER_TEMPLATE,
      isActive: true
    })

    // 4. Articles et Prix
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

    const createdItems: any[] = []
    for (const d of itemsData) {
      const it = await Item.create({ name: d.name, unit: d.unit, notes: 'Standard marché' })
      await ItemPrice.create({
        itemId: it._id,
        referencePrice: d.price,
        tolerancePercent: d.tolerance,
        startDate: new Date('2026-01-01')
      })
      createdItems.push(it)
    }

    // 5. Employés (chiffrés)
    const workersData = [
      { civility: 'M.', fullName: 'Kamga Jean-Pierre', cni: '1092837465', phone: '+237 677 12 34 56' },
      { civility: 'Mme', fullName: 'Ngo Biboum Marie', cni: '2019485736', phone: '+237 699 45 67 89' },
      { civility: 'M.', fullName: 'Bello Oumarou', cni: '1183749201', phone: '+237 655 98 76 54' }
    ]
    const createdWorkers: any[] = []
    for (const w of workersData) {
      const doc = await Worker.create({
        civility: w.civility,
        fullName: w.fullName,
        cniEncrypted: encryptField(w.cni),
        phoneEncrypted: encryptField(w.phone)
      })
      createdWorkers.push(doc)
    }

    // 6. Témoins (chiffrés)
    const witnessesData = [
      { civility: 'M.', fullName: 'Tchuente Paulin', cni: '3049581726', phone: '+237 670 11 22 33' },
      { civility: 'M.', fullName: 'Moussa Ibrahim', cni: '4091827364', phone: '+237 690 33 44 55' }
    ]
    const createdWitnesses: any[] = []
    for (const wt of witnessesData) {
      const doc = await Witness.create({
        civility: wt.civility,
        fullName: wt.fullName,
        cniEncrypted: encryptField(wt.cni),
        phoneEncrypted: encryptField(wt.phone)
      })
      createdWitnesses.push(doc)
    }

    // 7. Compteur séquentiel (initialisé à 105 pour laisser la place aux engagements de démo)
    await Counter.findByIdAndUpdate('commitment_number', { $set: { seq: 105 } }, { upsert: true })

    // 8. Engagements réalistes de démonstration
    const getLine = (index: number, quantity: number, declaredPrice: number) => {
      const it = createdItems[index]
      const ref = itemsData[index].price
      const tol = itemsData[index].tolerance
      const evalRes = evaluatePriceDifference(declaredPrice, ref, tol, tol * 2)
      return {
        itemId: it._id,
        name: it.name,
        unit: it.unit,
        quantity,
        unitPriceDeclared: declaredPrice,
        totalPriceDeclared: quantity * declaredPrice,
        referenceUnitPrice: ref,
        tolerancePercent: tol,
        differenceValue: evalRes.differenceValue,
        differencePercent: evalRes.differencePercent,
        status: evalRes.status
      }
    }

    // Engagement 1 : Demandé
    const l1 = [getLine(0, 50, 5000), getLine(1, 20, 8500)]
    const tot1 = l1.reduce((s, l) => s + l.totalPriceDeclared, 0)
    await Commitment.create({
      letterNumber: 'ENG-2026-0101',
      seq: 101,
      workerId: createdWorkers[0]._id,
      workerSnapshot: {
        civility: createdWorkers[0].civility,
        fullName: createdWorkers[0].fullName,
        cniMasked: '•••• 7465',
        phoneMasked: '•••• 3456'
      },
      purpose: 'Achat de ciment et fer pour coffrage dalle magasin',
      city: 'Yaoundé',
      date: new Date('2026-10-20'),
      templateVersion: 1,
      witnesses: [{
        witnessId: createdWitnesses[0]._id,
        civility: createdWitnesses[0].civility,
        fullName: createdWitnesses[0].fullName,
        cniMasked: '•••• 1726',
        phoneMasked: '•••• 2233'
      }],
      items: l1,
      amountRequested: tot1,
      amountApproved: 0,
      status: 'Demandé'
    })

    // Engagement 2 : Payé
    const l2 = [getLine(5, 1, 175000)]
    const tot2 = l2.reduce((s, l) => s + l.totalPriceDeclared, 0)
    const comm2 = await Commitment.create({
      letterNumber: 'ENG-2026-0102',
      seq: 102,
      workerId: createdWorkers[2]._id,
      workerSnapshot: {
        civility: createdWorkers[2].civility,
        fullName: createdWorkers[2].fullName,
        cniMasked: '•••• 9201',
        phoneMasked: '•••• 7654'
      },
      purpose: 'Approvisionnement carburant groupe électrogène',
      city: 'Yaoundé',
      date: new Date('2026-10-18'),
      templateVersion: 1,
      witnesses: [{
        witnessId: createdWitnesses[0]._id,
        civility: createdWitnesses[0].civility,
        fullName: createdWitnesses[0].fullName,
        cniMasked: '•••• 1726',
        phoneMasked: '•••• 2233'
      }],
      items: l2,
      amountRequested: tot2,
      amountApproved: tot2,
      status: 'Payé'
    })

    await Payment.create({
      commitmentId: comm2._id,
      amount: tot2,
      date: new Date('2026-10-18'),
      method: 'Espèces',
      reference: 'RECU-089'
    })

    console.log('✅ Données initiales créées avec succès.')
  } catch (err: any) {
    console.error('Erreur lors de l’initialisation des données :', err.message)
  } finally {
    isSeeding = false
  }
}
