import { auth0 } from '../../../lib/auth0'
import { AuthRepository } from '../repositories/AuthRepository'

/**
 * Resolves the authenticated photographer's profile ID from the Auth0 session.
 * On first login, creates or links the database User + PhotographerProfile.
 * Throws a 401 error object if the session is missing.
 */
export async function getAuthenticatedPhotographer(): Promise<string> {
  const session = await auth0.getSession()
  if (!session) {
    throw Object.assign(new Error('Unauthenticated'), { status: 401 })
  }

  const sub   = session.user.sub   as string
  const email = session.user.email as string
  const name  = (session.user.name as string | undefined) ?? email

  // 1. Look up by Auth0 sub (fast path after first login)
  let user = await AuthRepository.findUserBySub(sub)

  if (!user) {
    // 2. Existing account (e.g., dev seed user) — link the sub
    const byEmail = await AuthRepository.findUserByEmail(email)
    if (byEmail) {
      user = await AuthRepository.linkAuth0Sub(byEmail.id, sub)
    } else {
      // 3. Brand-new user — create with profile
      user = await AuthRepository.createUserWithProfile({ auth0Sub: sub, email, name })
    }
  }

  // Guard: ensure a PhotographerProfile exists (handles legacy users)
  if (!user.profile) {
    const profile = await AuthRepository.ensurePhotographerProfile(user.id)
    return profile.id
  }

  return user.profile.id
}
