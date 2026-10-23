import { describe, it, expect } from 'vitest'
import { LetterTemplateSchema, ActivateTemplateSchema, validateForm } from '../shared/schemas'

const BASE_URL = 'http://localhost:3000'

describe('Gestion des modèles de lettre & Confirmation par mot de passe patron', () => {
  it('1. LetterTemplateSchema exige un contenu d’au moins 50 caractères et le mot de passe', () => {
    // Échec sans mot de passe
    const noPwd = validateForm(LetterTemplateSchema, {
      content: 'Ceci est un texte de modèle de lettre suffisamment long pour respecter la contrainte minimale de 50 caractères.'
    })
    expect(noPwd.success).toBe(false)
    expect(noPwd.firstError).toContain('mot de passe')

    // Échec avec contenu trop court
    const shortContent = validateForm(LetterTemplateSchema, {
      content: 'Trop court',
      password: 'password123'
    })
    expect(shortContent.success).toBe(false)
    expect(shortContent.firstError).toContain('court')

    // Succès
    const valid = validateForm(LetterTemplateSchema, {
      content: 'Je soussigné {nom_employe} reconnais formellement avoir reçu la somme de {montant_chiffres} FCFA ({montant_lettres}) pour le motif : {motif}.',
      password: 'mon_mot_de_passe'
    })
    expect(valid.success).toBe(true)
  })

  it('2. ActivateTemplateSchema valide le numéro de version', () => {
    const invalid = validateForm(ActivateTemplateSchema, { version: -1 })
    expect(invalid.success).toBe(false)

    const valid = validateForm(ActivateTemplateSchema, { version: 2 })
    expect(valid.success).toBe(true)
    expect(valid.data?.version).toBe(2)
  })

  describe('Flux API complet : Authentification -> Création sécurisée -> Basculement de version', () => {
    let sessionCookie = ''

    it('3. Connexion du patron pour obtenir la session', async () => {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'patron',
          password: 'Patron@2026!'
        })
      })

      expect(loginRes.status).toBe(200)
      const setCookieHeader = loginRes.headers.get('set-cookie')
      expect(setCookieHeader).toBeDefined()
      sessionCookie = setCookieHeader!.split(';')[0]
    })

    it('4. Rejette la création d’une version de lettre si le mot de passe patron est faux', async () => {
      const res = await fetch(`${BASE_URL}/api/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          content: 'Texte d’un nouveau modèle de lettre d’engagement avec plus de 50 caractères obligatoires pour le test.',
          password: 'MauvaisMotDePasse!'
        })
      })

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.statusMessage).toContain('Mot de passe patron incorrect')
    })

    it('5. Accepte et crée une nouvelle version lorsque le mot de passe est correct', async () => {
      const res = await fetch(`${BASE_URL}/api/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          content: 'Nouveau modèle juridique validé par le patron avec au moins 50 caractères nécessaires pour la création.',
          password: 'Patron@2026!'
        })
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.template.version).toBeGreaterThanOrEqual(2)
      expect(json.template.isActive).toBe(true)
    })

    it('6. Permet de basculer d’un modèle à l’autre en activant la version 1', async () => {
      // Bascule vers la version 1
      const activateRes = await fetch(`${BASE_URL}/api/template/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ version: 1 })
      })

      expect(activateRes.status).toBe(200)
      const actJson = await activateRes.json()
      expect(actJson.success).toBe(true)
      expect(actJson.template.version).toBe(1)
      expect(actJson.template.isActive).toBe(true)

      // Vérifie via GET /api/template que la version 1 est bien le modèle actif
      const getRes = await fetch(`${BASE_URL}/api/template`, {
        headers: { Cookie: sessionCookie }
      })
      expect(getRes.status).toBe(200)
      const getJson = await getRes.json()
      expect(getJson.version).toBe(1)
      expect(getJson.isActive).toBe(true)
      expect(getJson.templates.length).toBeGreaterThanOrEqual(2)
    })
  })
})
