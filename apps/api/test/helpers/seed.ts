import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as request from 'supertest';
import { hashPassword } from '../../src/common/utils/password.util';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface SeededTenant {
  tenantId: string;
  adminId: string;
  adminEmail: string;
  adminPassword: string;
}

export async function seedTenant(
  prisma: PrismaService,
  overrides: { tenantName?: string; email?: string } = {},
): Promise<SeededTenant> {
  const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const tenantName = overrides.tenantName ?? `Tenant-${uid}`;
  const adminEmail = overrides.email ?? `admin-${uid}@test.com`;
  const adminPassword = 'Senha123';

  const tenant = await prisma.tenant.create({ data: { name: tenantName } });
  const hashed = await hashPassword(adminPassword);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Test',
      email: adminEmail,
      password: hashed,
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  });

  return { tenantId: tenant.id, adminId: admin.id, adminEmail, adminPassword };
}

export async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

export async function cleanupTenant(prisma: PrismaService, tenantId: string): Promise<void> {
  await prisma.chip.deleteMany({ where: { tenantId } });
  await prisma.tracker.deleteMany({ where: { tenantId } });
  await prisma.vehicle.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
  await prisma.tenant.deleteMany({ where: { id: tenantId } });
}
