import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = 'http://localhost:3000'

describe('Contrôle d’accès RBAC (3 Rôles : Patron, Secrétaire, Technicien)', () => {
  let patronCookie = ''
  let secretaireCookie = ''
  let technicienCookie = ''

  let testCommitmentId = ''

  // 1. Authentification des 3 rôles
  it('1. Authentifie le Patron et vérifie son rôle PATRON', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'patron', password: 'Patron@2026!' })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.role).toBe('PATRON')

    const rawCookies = res.headers.get('set-cookie')
    expect(rawCookies).toBeTruthy()
    patronCookie = rawCookies!.split(';')[0]
  })

  it('2. Authentifie la Secrétaire et vérifie son rôle SECRETAIRE', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'secretaire', password: 'Secretaire@2026!' })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.role).toBe('SECRETAIRE')

    const rawCookies = res.headers.get('set-cookie')
    expect(rawCookies).toBeTruthy()
    secretaireCookie = rawCookies!.split(';')[0]
  })

  it('3. Authentifie le Technicien et vérifie son rôle TECHNICIEN', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'technicien', password: 'Technicien@2026!' })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.role).toBe('TECHNICIEN')

    const rawCookies = res.headers.get('set-cookie')
    expect(rawCookies).toBeTruthy()
    technicienCookie = rawCookies!.split(';')[0]
  })

  // 2. Création d'engagement par la Secrétaire (autorisé)
  it('4. La Secrétaire peut créer un engagement légitime', async () => {
    // Récupérer un travailleur
    const workersRes = await fetch(`${BASE_URL}/api/workers`, {
      headers: { Cookie: secretaireCookie }
    })
    expect(workersRes.status).toBe(200)
    const workersJson = await workersRes.json()
    const worker = workersJson.workers[0]

    // Récupérer un article
    const itemsRes = await fetch(`${BASE_URL}/api/items`, {
      headers: { Cookie: secretaireCookie }
    })
    expect(itemsRes.status).toBe(200)
    const itemsJson = await itemsRes.json()
    const item = itemsJson.items[0]

    const res = await fetch(`${BASE_URL}/api/commitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: secretaireCookie
      },
      body: JSON.stringify({
        workerId: worker.id,
        purpose: 'Achat outillage pour travaux urgents',
        city: 'Yaoundé',
        date: '2026-10-23',
        witnessIds: [],
        items: [
          {
            itemId: item.id,
            quantity: 2,
            unitPriceDeclared: 5000
          }
        ]
      })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitment.status).toBe('Demandé')
    testCommitmentId = json.commitment.id
  })

  // 3. Blocage de validation pour Secrétaire et Technicien
  it('5. La Secrétaire NE PEUT PAS valider un engagement (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/commitments/${testCommitmentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: secretaireCookie
      },
      body: JSON.stringify({
        approved: true,
        amountApproved: 10000
      })
    })

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.statusMessage).toContain('Accès refusé')
  })

  it('6. Le Technicien NE PEUT PAS valider un engagement (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/commitments/${testCommitmentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: technicienCookie
      },
      body: JSON.stringify({
        approved: true,
        amountApproved: 10000
      })
    })

    expect(res.status).toBe(403)
  })

  it('7. Le Patron PEUT valider l’engagement (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/commitments/${testCommitmentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: patronCookie
      },
      body: JSON.stringify({
        approved: true,
        amountApproved: 10000
      })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitment.status).toBe('Accepté')
  })

  // 4. Blocage de paiement / décaissement
  it('8. La Secrétaire NE PEUT PAS enregistrer un paiement (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: secretaireCookie
      },
      body: JSON.stringify({
        commitmentId: testCommitmentId,
        amount: 10000,
        method: 'Espèces',
        date: '2026-10-23'
      })
    })

    expect(res.status).toBe(403)
  })

  it('9. Le Patron PEUT enregistrer le décaissement (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: patronCookie
      },
      body: JSON.stringify({
        commitmentId: testCommitmentId,
        amount: 10000,
        method: 'Espèces',
        date: '2026-10-23',
        reference: 'CAISSE-TEST-001'
      })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.commitmentStatus).toBe('Payé')
  })

  // 5. Blocage des Paramètres et Journal d'Audit
  it('10. La Secrétaire et le Technicien NE PEUVENT PAS accéder au journal d’audit (403 Forbidden)', async () => {
    const resSec = await fetch(`${BASE_URL}/api/audit`, {
      headers: { Cookie: secretaireCookie }
    })
    expect(resSec.status).toBe(403)

    const resTech = await fetch(`${BASE_URL}/api/audit`, {
      headers: { Cookie: technicienCookie }
    })
    expect(resTech.status).toBe(403)
  })

  it('11. Le Patron accède aux logs d’audit (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/audit`, {
      headers: { Cookie: patronCookie }
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.logs).toBeDefined()
  })

  // 6. Gestion des Utilisateurs par le Patron
  let createdUserId = ''

  it('12. La Secrétaire ne peut pas gérer les comptes utilisateurs (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: secretaireCookie }
    })
    expect(res.status).toBe(403)
  })

  it('13. Le Patron liste les comptes et crée un nouveau compte Technicien (200 OK)', async () => {
    const listRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: patronCookie }
    })
    expect(listRes.status).toBe(200)
    const listJson = await listRes.json()
    expect(listJson.users.length).toBeGreaterThanOrEqual(3)

    // Création d'un nouveau compte
    const createRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: patronCookie
      },
      body: JSON.stringify({
        username: 'tech_junior',
        name: 'M. Alioune (Assistant Technicien)',
        role: 'TECHNICIEN',
        password: 'Password@2026!'
      })
    })

    expect(createRes.status).toBe(200)
    const createJson = await createRes.json()
    expect(createJson.success).toBe(true)
    expect(createJson.user.role).toBe('TECHNICIEN')
    createdUserId = createJson.user.id
  })

  it('14. Le Patron modifie le rôle du compte créé vers SECRETAIRE (200 OK)', async () => {
    const updateRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: patronCookie
      },
      body: JSON.stringify({
        name: 'M. Alioune (Secrétaire Adjoint)',
        role: 'SECRETAIRE'
      })
    })

    expect(updateRes.status).toBe(200)
    const updateJson = await updateRes.json()
    expect(updateJson.user.role).toBe('SECRETAIRE')
  })

  it('15. Le Patron supprime le compte de test créé (200 OK)', async () => {
    const delRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Cookie: patronCookie }
    })

    expect(delRes.status).toBe(200)
    const delJson = await delRes.json()
    expect(delJson.success).toBe(true)
  })

  it('16. Le Patron ne peut pas supprimer son propre compte (400 Bad Request)', async () => {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: patronCookie }
    })
    const meJson = await meRes.json()

    const delRes = await fetch(`${BASE_URL}/api/users/${meJson.user.id}`, {
      method: 'DELETE',
      headers: { Cookie: patronCookie }
    })

    expect(delRes.status).toBe(400)
  })

  // 7. Contrôle des articles et prix par le Technicien
  it('17. Le Technicien peut créer un nouvel article avec son prix de référence (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: technicienCookie
      },
      body: JSON.stringify({
        name: 'Plaque de plâtre BA13 Standard',
        unit: 'Plaque',
        referencePrice: 4500,
        tolerancePercent: 10,
        notes: 'Prix relevé par le technicien sur le marché'
      })
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.item.name).toBe('Plaque de plâtre BA13 Standard')
  })
})
