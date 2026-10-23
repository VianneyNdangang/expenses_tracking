import type { H3Event } from 'h3'
import type { UserRole } from '../../shared/schemas'
import type { IUser } from '../models/User'

/**
 * Vérifie que l'utilisateur authentifié possède l'un des rôles autorisés.
 * Lève une erreur 401 si non connecté, ou 403 si le rôle ne correspond pas.
 */
export function requireRole(event: H3Event, ...allowedRoles: UserRole[]): IUser {
  const user = event.context.user as IUser | undefined

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentification requise pour effectuer cette opération.'
    })
  }

  const userRole = (user.role || 'PATRON') as UserRole

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    const rolesFr: Record<UserRole, string> = {
      PATRON: 'Patron',
      SECRETAIRE: 'Secrétaire',
      TECHNICIEN: 'Technicien'
    }
    const allowedLabels = allowedRoles.map(r => rolesFr[r] || r).join(', ')
    const userRoleLabel = rolesFr[userRole] || userRole

    throw createError({
      statusCode: 403,
      statusMessage: `Accès refusé : cette action est réservée au(x) rôle(s) [${allowedLabels}]. Votre profil est : ${userRoleLabel}.`
    })
  }

  return user
}
