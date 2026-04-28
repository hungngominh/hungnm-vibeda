import { PrismaClient } from '@prisma/client';
import { DbActionExecutor } from '@vegabase/service';
import { Argon2idHasher } from '@vegabase/api';

const prisma = new PrismaClient();
const executor = new DbActionExecutor();
const hasher = new Argon2idHasher();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'moodaily2024';
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD not set — using default password. Change it after first login.')
  }

  const existing = await prisma.user.findFirst({ where: { username, isDeleted: false } });
  if (existing) {
    console.log(`Admin user "${username}" already exists — skipping.`);
    return;
  }

  const passwordHash = await hasher.hash(password);
  const result = await executor.addAsync(prisma.user, { username, passwordHash }, 'seed');
  if (result.isSuccess) {
    console.log(`✅ Admin user "${username}" created.`);
  } else {
    console.error('❌ Failed to create admin user:', result.error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
