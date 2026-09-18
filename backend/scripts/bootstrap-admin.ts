/**
 * Admin bootstrap script — creates or promotes a user to ADMIN.
 * Idempotent: safe to run multiple times.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=changeme npx ts-node -r tsconfig-paths/register scripts/bootstrap-admin.ts
 *
 * Never commit real credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD
 * as environment variables or in backend/.env (which is git-ignored).
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role === 'ADMIN') {
        console.log(`[bootstrap] ${email} is already ADMIN — nothing to do`);
      } else {
        await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
        console.log(`[bootstrap] Promoted ${email} to ADMIN`);
      }
    } else {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.create({ data: { email, password: hashed, role: 'ADMIN' } });
      console.log(`[bootstrap] Created ADMIN user ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
