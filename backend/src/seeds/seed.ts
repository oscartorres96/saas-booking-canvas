import { NestFactory } from '@nestjs/core';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ServicesService } from '../services/services.service';
import { BookingsService } from '../bookings/bookings.service';
import {
  businessSeeds,
  clientDomains,
  clientFirstNames,
  clientLastNames,
  serviceTemplatesByType,
} from './data';
import { hashPassword, randomFutureDate, randomItem, slugify, uniqueEmail } from './seed.utils';
import { UserRole } from '../users/schemas/user.schema';
import { BookingStatus } from '../bookings/schemas/booking.schema';

type AuthUser = { userId: string; role: UserRole; businessId?: string };

const asId = (entity: any) => entity?._id?.toString?.() ?? entity?.id ?? '';

async function ensureOwner(usersService: UsersService) {
  const ownerEmail = 'owner@bookpro.com';
  const existingOwner = await usersService.findByEmail(ownerEmail);
  if (existingOwner) {
    const passwordOk = await bcrypt.compare('admin2025', existingOwner.password_hash);
    if (!passwordOk || existingOwner.role !== UserRole.Owner) {
      const password_hash = await hashPassword('admin2025');
      const ownerId = asId(existingOwner);
      await usersService.update(ownerId, {
        password_hash,
        role: UserRole.Owner,
        name: existingOwner.name || 'BookPro Owner',
      });
      const refreshed = await usersService.findByEmail(ownerEmail);
      if (refreshed) return refreshed;
    }
    return existingOwner;
  }

  const password_hash = await hashPassword('admin2025');
  return usersService.create({
    email: ownerEmail,
    name: 'BookPro Owner',
    password_hash,
    role: UserRole.Owner,
  });
}

async function ensureBusinesses(
  businessesService: BusinessesService,
  ownerAuth: AuthUser,
  ownerId: string,
) {
  const existing = await businessesService.findAll(ownerAuth);

  return Promise.all(
    businessSeeds.map(async (seed) => {
      const found = existing.find((b: any) => b.name === seed.name || b.businessName === seed.name);
      const basePayload = {
        name: seed.name,
        businessName: seed.name,
        address: seed.address,
        ownerUserId: ownerId,
        ownerName: 'BookPro Owner',
        type: seed.type,
        subscriptionStatus: 'trial',
        email: `${slugify(seed.name)}@example.com`,
      };

      if (found) {
        const needsUpdate =
          !found.subscriptionStatus ||
          !found.ownerName ||
          !found.email ||
          !found.businessName ||
          found.type !== seed.type;
        if (needsUpdate) {
          await businessesService.update(asId(found), basePayload, ownerAuth);
          return businessesService.findOne(asId(found), ownerAuth);
        }
        return found;
      }

      return businessesService.create(basePayload, ownerAuth);
    }),
  );
}

async function ensureBusinessUsers(
  usersService: UsersService,
  businesses: any[],
  businessPasswordHash: string,
) {
  const results: Record<string, any> = {};

  for (const business of businesses) {
    const businessId = asId(business);
    const email = `${slugify(business.name)}@example.com`;
    const existing = await usersService.findByEmail(email);

    if (existing) {
      results[businessId] = existing;
      continue;
    }

    const created = await usersService.create({
      email,
      name: `${business.name} Admin`,
      password_hash: businessPasswordHash,
      role: UserRole.Business,
      businessId,
    });
    results[businessId] = created;
  }

  return results;
}

async function ensureServicesPerBusiness(
  servicesService: ServicesService,
  businesses: any[],
  ownerAuth: AuthUser,
) {
  const servicesByBusiness: Record<string, any[]> = {};
  const existingServices = await servicesService.findAll(ownerAuth);

  for (const business of businesses) {
    const businessId = asId(business);
    const typeKey = business.type ?? 'other';
    const templates = serviceTemplatesByType[typeKey] || serviceTemplatesByType.other;
    const allowedNames = new Set(templates.map((t) => t.name));
    const servicesForBusiness = existingServices.filter(
      (service) => service.businessId === businessId,
    );

    for (const svc of [...servicesForBusiness]) {
      if (!allowedNames.has(svc.name)) {
        await servicesService.remove(asId(svc), ownerAuth);
        const idx = servicesForBusiness.findIndex((s) => asId(s) === asId(svc));
        if (idx >= 0) servicesForBusiness.splice(idx, 1);
      }
    }

    for (const template of templates) {
      const alreadyExists = servicesForBusiness.some((service) => service.name === template.name);
      if (alreadyExists) continue;

      const created = await servicesService.create(
        {
          ...template,
          active: true,
          businessId,
        },
        ownerAuth,
      );

      servicesForBusiness.push(created as any);
    }

    servicesByBusiness[businessId] = servicesForBusiness;
  }

  return servicesByBusiness;
}

async function ensureClientsPerBusiness(
  usersService: UsersService,
  businesses: any[],
  clientPasswordHash: string,
) {
  const allUsers = await usersService.findAll();
  const clientsByBusiness: Record<string, any[]> = {};

  for (const business of businesses) {
    const businessId = asId(business);
    const existingClients = allUsers.filter(
      (user) => user.role === UserRole.Client && user.businessId === businessId,
    );

    const needed = 10 - existingClients.length;

    for (let i = 0; i < needed; i += 1) {
      const firstName = randomItem(clientFirstNames);
      const lastName = randomItem(clientLastNames);
      const name = `${firstName} ${lastName}`;
      const email = uniqueEmail(
        `${firstName}.${lastName}.${businessId}`,
        randomItem(clientDomains),
        `${existingClients.length + i + 1}`,
      );

      const client = await usersService.create({
        email,
        name,
        password_hash: clientPasswordHash,
        role: UserRole.Client,
        businessId,
      });

      existingClients.push(client as any);
      allUsers.push(client as any);
    }

    clientsByBusiness[businessId] = existingClients.slice(0, 10);
  }

  return clientsByBusiness;
}

async function ensureBookingsPerBusiness(
  bookingsService: BookingsService,
  servicesByBusiness: Record<string, any[]>,
  clientsByBusiness: Record<string, any[]>,
  ownerAuth: AuthUser,
) {
  const existingBookings = await bookingsService.findAll(ownerAuth);

  for (const businessId of Object.keys(servicesByBusiness)) {
    const bookingsForBusiness = existingBookings.filter((booking) => booking.businessId === businessId);
    const clients = clientsByBusiness[businessId] ?? [];
    const services = servicesByBusiness[businessId] ?? [];
    const needed = Math.max(0, 10 - bookingsForBusiness.length);

    for (let i = 0; i < needed; i += 1) {
      const client = randomItem(clients);
      const service = randomItem(services);

      const booking = await bookingsService.create(
        {
          clientName: client.name,
          clientEmail: client.email,
          businessId,
          serviceId: asId(service),
          serviceName: service.name,
          scheduledAt: randomFutureDate(),
          status: BookingStatus.Confirmed,
          userId: asId(client),
        },
        ownerAuth,
      );

      bookingsForBusiness.push(booking as any);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  await mongoose.connection.asPromise();
  // eslint-disable-next-line no-console
  const primaryConn =
    mongoose.connections.find((conn) => conn.readyState === 1) ?? mongoose.connection;
  const connectedDb = primaryConn?.db?.databaseName ?? primaryConn?.name ?? 'unknown';
  console.log('🚀 Seed connected to DB:', connectedDb);

  const usersService = app.get(UsersService);
  const businessesService = app.get(BusinessesService);
  const servicesService = app.get(ServicesService);
  const bookingsService = app.get(BookingsService);

  const owner = await ensureOwner(usersService);
  const ownerId = asId(owner);
  const ownerAuth: AuthUser = { userId: ownerId, role: UserRole.Owner };

  const [businessPasswordHash, clientPasswordHash] = await Promise.all([
    hashPassword('business123'),
    hashPassword('client123'),
  ]);

  const businesses = await ensureBusinesses(businessesService, ownerAuth, ownerId);
  await ensureBusinessUsers(usersService, businesses, businessPasswordHash);
  const servicesByBusiness = await ensureServicesPerBusiness(servicesService, businesses, ownerAuth);
  const clientsByBusiness = await ensureClientsPerBusiness(usersService, businesses, clientPasswordHash);
  await ensureBookingsPerBusiness(bookingsService, servicesByBusiness, clientsByBusiness, ownerAuth);

  // eslint-disable-next-line no-console
  console.log('🌱 Seed completed and connection closed');
  await app.close();
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', err);
  process.exit(1);
});
