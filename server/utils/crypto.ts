import crypto from 'node:crypto'
import argon2 from 'argon2'

/**
 * Récupère la clé de chiffrement AES-256-GCM depuis la configuration ou l'environnement.
 * La clé doit comporter exactement 32 octets (256 bits).
 */
function getEncryptionKey(): Buffer {
  const runtimeKey = typeof useRuntimeConfig === 'function' ? useRuntimeConfig().fieldEncryptionKey : ''
  const hexKey = process.env.FIELD_ENCRYPTION_KEY || runtimeKey
  if (!hexKey) {
    throw new Error('FIELD_ENCRYPTION_KEY is not defined in environment variables')
  }
  const keyBuf = Buffer.from(hexKey, 'hex')
  if (keyBuf.length !== 32) {
    throw new Error(`FIELD_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters), got ${keyBuf.length} bytes`)
  }
  return keyBuf
}

/**
 * Chiffre une chaîne de caractères en AES-256-GCM.
 * Format de sortie : iv_hex:authTag_hex:encrypted_hex
 */
export function encryptField(plainText: string): string {
  if (!plainText) return ''
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12) // 96 bits recommandés pour GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Déchiffre une chaîne chiffrée en AES-256-GCM.
 */
export function decryptField(cipherText: string): string {
  if (!cipherText) return ''
  // Si ce n'est pas au format iv:tag:data, renvoie la valeur brute (cas de transition / clair)
  const parts = cipherText.split(':')
  if (parts.length !== 3) {
    return cipherText
  }

  const [ivHex, authTagHex, encryptedHex] = parts
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Masque une valeur sensible pour affichage partiel (ex: CNI, téléphone)
 * Ex: "102938475" -> "•••• 8475"
 */
export function maskSensitive(value: string, visibleDigits: number = 4): string {
  if (!value) return ''
  const str = String(value).trim()
  if (str.length <= visibleDigits) return str
  const visible = str.slice(-visibleDigits)
  return '•••• ' + visible
}

/**
 * Hachage d'un mot de passe avec Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1
  })
}

/**
 * Vérification d'un mot de passe avec Argon2id.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

/**
 * Hachage d'un jeton de session pour stockage en base (SHA-256).
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Génère un identifiant opaque de session sécurisé (32 octets aléatoires en hex).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
