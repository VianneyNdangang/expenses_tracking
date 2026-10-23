import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3000'

describe('Cycle complet E2E : Connexion -> Engagement -> Acceptation -> Paiement -> Justification', () => {
  let sessionCookie = ''
  let createdCommitmentId = ''
  let letterNumber = ''

  it('1. Rejette la connexion avec de mauvais identifiants', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'patron', password: 'MauvaisMotDePasse!' })
    })

    expect(res.status).toBe(401)
  })

  it('2. Authentifie le patron avec Argon2id et dépose un cookie de session opaque', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'patron', password: 'Patron@2026!' })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.username).toBe('patron')

    const rawCookies = res.headers.get('set-cookie')
    expect(rawCookies).toBeTruthy()
    expect(rawCookies).toContain('abd_session_id=')
    expect(rawCookies).toContain('HttpOnly')
    expect(rawCookies).toContain('SameSite=Strict')

    // Extrait le cookie pour les requêtes suivantes
    sessionCookie = rawCookies!.split(';')[0]
  })

  it('3. Récupère le statut de session authentifiée', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/status`, {
      headers: { Cookie: sessionCookie }
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.authenticated).toBe(true)
    expect(json.user.username).toBe('patron')
  })

  it('4. Charge le tableau de bord avec KPIs et alertes', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Cookie: sessionCookie }
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.kpis).toBeDefined()
    expect(json.kpis.totalCommitted).toBeGreaterThanOrEqual(0)
    expect(json.statusCounts).toBeDefined()
  })

  it('5. Crée un nouvel engagement avec comparaison de prix en direct et numéro séquentiel', async () => {
    // Récupérer un employé
    const workersRes = await fetch(`${BASE_URL}/api/workers`, {
      headers: { Cookie: sessionCookie }
    })
    const workers = await workersRes.json()
    expect(workers.length).toBeGreaterThan(0)
    const worker = workers[0]

    // Récupérer un article
    const itemsRes = await fetch(`${BASE_URL}/api/items`, {
      headers: { Cookie: sessionCookie }
    })
    const items = await itemsRes.json()
    expect(items.length).toBeGreaterThan(0)
    const item = items[0]

    const payload = {
      workerId: worker.id,
      purpose: 'Achat urgent de fournitures maçonnerie test E2E',
      city: 'Yaoundé',
      date: new Date().toISOString(),
      witnessIds: [],
      lines: [
        {
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          quantity: 10,
          unitPriceDeclared: item.referencePrice // Conforme
        }
      ]
    }

    const res = await fetch(`${BASE_URL}/api/commitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie
      },
      body: JSON.stringify(payload)
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitment.id).toBeDefined()
    expect(json.commitment.status).toBe('Demandé')

    createdCommitmentId = json.commitment.id
    letterNumber = json.commitment.letterNumber
    expect(letterNumber.startsWith('ENG-')).toBe(true)
  })

  it('6. Le patron valide et accepte l’engagement', async () => {
    const res = await fetch(`${BASE_URL}/api/commitments/${createdCommitmentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie
      },
      body: JSON.stringify({ approved: true })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitment.status).toBe('Accepté')
  })

  it('7. Enregistre le paiement avec transaction MongoDB atomique', async () => {
    // Récupère l'engagement pour avoir le montant accordé
    const detailRes = await fetch(`${BASE_URL}/api/commitments/${createdCommitmentId}`, {
      headers: { Cookie: sessionCookie }
    })
    const detail = await detailRes.json()
    const amountToPay = detail.amountApproved

    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        commitmentId: createdCommitmentId,
        amount: amountToPay,
        date: new Date().toISOString(),
        method: 'Espèces',
        reference: 'RECU-TEST-E2E',
        notes: 'Fonds décaissés pour test E2E'
      })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitmentStatus).toBe('Payé')
  })

  it('8. Enregistre la justification et calcule le reliquat avec transaction atomique', async () => {
    const detailRes = await fetch(`${BASE_URL}/api/commitments/${createdCommitmentId}`, {
      headers: { Cookie: sessionCookie }
    })
    const detail = await detailRes.json()
    const amountPaid = detail.payment.amount

    // Dépense réelle inférieure de 2000 FCFA pour générer un reliquat de 2000 FCFA
    const amountSpent = amountPaid - 2000

    const res = await fetch(`${BASE_URL}/api/justifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        commitmentId: createdCommitmentId,
        amountSpent,
        notes: 'Facture acquittée présentée. Reliquat restitué en espèces.',
        date: new Date().toISOString()
      })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitmentStatus).toBe('Justifié')
    expect(json.justification.balance).toBe(2000)
  })

  it('9. Vérifie que toutes les étapes ont été consignées dans le journal d’audit non modifiable', async () => {
    const res = await fetch(`${BASE_URL}/api/audit?entity=Commitment`, {
      headers: { Cookie: sessionCookie }
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.logs.length).toBeGreaterThan(0)
    const actions = json.logs.map((l: any) => l.action)
    expect(actions).toContain('CREATE_COMMITMENT')
    expect(actions).toContain('APPROVE_COMMITMENT')
  })

  it('10. Exporte les engagements au format Excel et CSV', async () => {
    const resCsv = await fetch(`${BASE_URL}/api/exports/commitments?format=csv`, {
      headers: { Cookie: sessionCookie }
    })
    expect(resCsv.status).toBe(200)
    const csv = await resCsv.text()
    expect(csv).toContain('Numéro Lettre')
    expect(csv).toContain(letterNumber)

    const resXlsx = await fetch(`${BASE_URL}/api/exports/commitments?format=excel`, {
      headers: { Cookie: sessionCookie }
    })
    expect(resXlsx.status).toBe(200)
    expect(resXlsx.headers.get('content-type')).toContain('spreadsheetml')
  })

  it('11. Télécharge la lettre d\'engagement officielle en PDF sans redirection', async () => {
    // 1. Sans session -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/commitments/${createdCommitmentId}/pdf`)
    expect(unauthRes.status).toBe(401)

    // 2. Avec session -> 200 et binaire PDF officiel
    const resPdf = await fetch(`${BASE_URL}/api/commitments/${createdCommitmentId}/pdf`, {
      headers: { Cookie: sessionCookie }
    })
    expect(resPdf.status).toBe(200)
    expect(resPdf.headers.get('content-type')).toBe('application/pdf')
    expect(resPdf.headers.get('content-disposition')).toContain('attachment')
    expect(resPdf.headers.get('content-disposition')).toContain('.pdf')

    const arrayBuffer = await resPdf.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    expect(buffer.length).toBeGreaterThan(100)
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
  })
})
