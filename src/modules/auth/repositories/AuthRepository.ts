import { prisma } from '../../../infrastructure/database/db'

export const AuthRepository = {
  async findUserBySub(auth0Sub: string) {
    return prisma.user.findUnique({
      where:   { auth0Sub },
      include: { profile: { select: { id: true } } },
    })
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where:   { email },
      include: { profile: { select: { id: true } } },
    })
  },

  async createUserWithProfile(data: { auth0Sub: string; email: string; name: string }) {
    const freePlan = await prisma.plan.findFirst({ where: { name: 'FREE' } })
    if (!freePlan) throw new Error('FREE plan not found — run db:seed')

    return prisma.user.create({
      data: {
        auth0Sub: data.auth0Sub,
        email:    data.email,
        name:     data.name,
        profile:  { create: { planId: freePlan.id, storageLimitGB: freePlan.storageLimitGB } },
      },
      include: { profile: { select: { id: true } } },
    })
  },

  async linkAuth0Sub(userId: string, auth0Sub: string) {
    return prisma.user.update({
      where:   { id: userId },
      data:    { auth0Sub },
      include: { profile: { select: { id: true } } },
    })
  },

  async ensurePhotographerProfile(userId: string) {
    const freePlan = await prisma.plan.findFirst({ where: { name: 'FREE' } })
    if (!freePlan) throw new Error('FREE plan not found — run db:seed')

    return prisma.photographerProfile.upsert({
      where:  { userId },
      create: { userId, planId: freePlan.id, storageLimitGB: freePlan.storageLimitGB },
      update: {},
      select: { id: true },
    })
  },
}
