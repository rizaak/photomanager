import { PrismaClient, PlanName, GalleryStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Plans ─────────────────────────────────────────────────────────────────
  const plans = [
    { name: PlanName.FREE,   storageLimitGB: 10,   maxGalleries: 3    },
    { name: PlanName.PRO,    storageLimitGB: 100,  maxGalleries: null },
    { name: PlanName.STUDIO, storageLimitGB: 1000, maxGalleries: null },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where:  { name: plan.name },
      update: {},
      create: plan,
    })
  }

  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { name: PlanName.FREE } })

  // ── Dev user ──────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where:  { email: 'dev@frame.local' },
    update: {},
    create: {
      email:        'dev@frame.local',
      name:         'Dev Photographer',
      passwordHash: 'not-set',
    },
  })

  // ── Photographer profile ──────────────────────────────────────────────────
  const profile = await prisma.photographerProfile.upsert({
    where:  { userId: user.id },
    update: {},
    create: {
      userId:       user.id,
      planId:       freePlan.id,
      businessName: 'Frame Dev Studio',
    },
  })

  // ── Galleries (match mock IDs used in the frontend) ───────────────────────
  const galleries = [
    { id: 'gal_1', title: 'Martinez Wedding',    clientName: 'Elena & Marco Martinez', status: GalleryStatus.ACTIVE   },
    { id: 'gal_2', title: 'Chen Family Session', clientName: 'The Chen Family',        status: GalleryStatus.ACTIVE   },
    { id: 'gal_3', title: 'Park Engagement',     clientName: 'Julia & David Park',     status: GalleryStatus.DRAFT    },
    { id: 'gal_4', title: 'Thompson Newborn',    clientName: 'The Thompson Family',    status: GalleryStatus.ARCHIVED },
    { id: 'gal_5', title: 'Lee Corporate',       clientName: 'Lee & Associates',       status: GalleryStatus.ACTIVE   },
    { id: 'gal_6', title: 'Nguyen Birthday',     clientName: 'Minh Nguyen',            status: GalleryStatus.ACTIVE   },
  ]

  for (const g of galleries) {
    await prisma.gallery.upsert({
      where:  { id: g.id },
      update: {},
      create: {
        id:            g.id,
        photographerId: profile.id,
        title:         g.title,
        clientName:    g.clientName,
        status:        g.status,
        shareToken:    `dev-share-${g.id}`,
      },
    })
  }

  console.log('Seed complete — plans, dev user, and mock galleries ready.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
