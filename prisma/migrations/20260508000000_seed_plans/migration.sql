-- Seed required Plan rows. ON CONFLICT DO NOTHING makes this idempotent.
INSERT INTO "Plan" (id, name, "storageLimitGB", "maxGalleries", "photoLimitPerGallery", "createdAt")
VALUES
  (gen_random_uuid()::text, 'FREE',    5,   3,    50,   NOW()),
  (gen_random_uuid()::text, 'STARTER', 50,  15,   300,  NOW()),
  (gen_random_uuid()::text, 'PRO',     500, NULL, NULL, NOW())
ON CONFLICT (name) DO NOTHING;
