import { describe, it, expect, beforeAll } from 'vitest'
import {
  encryptField,
  decryptField,
  maskSensitive,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashSessionToken
} from '../server/utils/crypto'

describe('Sécurité et Cryptographie (AES-256-GCM, Argon2id, Sessions)', () => {
  beforeAll(() => {
    // Clé de test de 32 octets (64 hex)
    process.env.FIELD_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  })

  it('chiffre et déchiffre une chaîne sensible avec AES-256-GCM', () => {
    const cni = '1092837465'
    const encrypted = encryptField(cni)
    
    expect(encrypted).not.toBe(cni)
    expect(encrypted.split(':').length).toBe(3) // iv:tag:data

    const decrypted = decryptField(encrypted)
    expect(decrypted).toBe(cni)
  })

  it('masque convenablement les données sensibles pour affichage', () => {
    expect(maskSensitive('1092837465', 4)).toBe('•••• 7465')
    expect(maskSensitive('+237699001122', 4)).toBe('•••• 1122')
    expect(maskSensitive('123', 4)).toBe('123')
  })

  it('hache et valide un mot de passe avec Argon2id', async () => {
    const pwd = 'SuperMotDePasse!2026'
    const hash = await hashPassword(pwd)
    
    expect(hash.startsWith('$argon2id$')).toBe(true)

    const isValid = await verifyPassword(hash, pwd)
    expect(isValid).toBe(true)

    const isInvalid = await verifyPassword(hash, 'MauvaisMotDePasse')
    expect(isInvalid).toBe(false)
  })

  it('génère un jeton de session opaque et son empreinte SHA-256 en base', () => {
    const token = generateSessionToken()
    expect(token.length).toBe(64) // 32 octets hex

    const hash1 = hashSessionToken(token)
    const hash2 = hashSessionToken(token)
    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(token)
  })
})
