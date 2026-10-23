import type { H3Event } from 'h3'
import { Session, type ISession } from '../models/Session'
import { User, type IUser } from '../models/User'
import { generateSessionToken, hashSessionToken } from './crypto'

const SESSION_COOKIE_NAME = 'abd_session_id'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes

/**
 * Crée une nouvelle session pour l'utilisateur, l'enregistre en base et dépose le cookie sécurisé.
 */
export async function createSession(event: H3Event, user: IUser): Promise<{ rawToken: string; session: ISession }> {
  // Génère un jeton opaque 64 hex
  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  const userAgent = getRequestHeader(event, 'user-agent') || ''
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const session = await Session.create({
    tokenHash,
    userId: user._id,
    ip,
    userAgent,
    expiresAt
  })

  // Enregistre le cookie HttpOnly, Secure, SameSite=Lax (pour persister lors de l'ouverture de liens ou nouveaux onglets)
  setCookie(event, SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000)
  })

  return { rawToken, session }
}

/**
 * Valide la session active, renouvelle l'expiration glissante et charge l'utilisateur.
 */
export async function validateSession(event: H3Event): Promise<{ user: IUser; session: ISession } | null> {
  const rawToken = getCookie(event, SESSION_COOKIE_NAME)
  if (!rawToken) {
    return null
  }

  const tokenHash = hashSessionToken(rawToken)
  const session = await Session.findOne({ tokenHash })

  if (!session) {
    // Si le jeton est invalide en base, supprimer le cookie obsolète
    deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  // Vérifier l'expiration
  if (session.expiresAt.getTime() < Date.now()) {
    await Session.deleteOne({ _id: session._id })
    deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  const user = await User.findById(session.userId)
  if (!user) {
    await Session.deleteOne({ _id: session._id })
    deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  // Expiration glissante : prolonger si la session a plus d'1 heure
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  session.expiresAt = newExpiresAt
  await session.save()

  setCookie(event, SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000)
  })

  return { user, session }
}

/**
 * Détruit la session active en base et efface le cookie du navigateur.
 */
export async function destroySession(event: H3Event): Promise<void> {
  const rawToken = getCookie(event, SESSION_COOKIE_NAME)
  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken)
    await Session.deleteOne({ tokenHash })
  }

  deleteCookie(event, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  })
}
