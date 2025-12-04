import { NestFactory } from '@nestjs/core';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ServicesService } from '../services/services.service';
import { UserRole } from '../users/schemas/user.schema';
import { serviceTemplatesByType } from './data';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    await mongoose.connection.asPromise();
    console.log('🚀 QA Seed connected to DB');

    const usersService = app.get(UsersService);
    const businessesService = app.get(BusinessesService);
    const servicesService = app.get(ServicesService);

    const qaData = [
        {
            email: 'jennifermbm14@gmail.com',
            password: 'Gignac 10',
            businessName: 'Nutrióloga Jenni',
            type: 'nutritionist',
            ownerName: 'Jennifer',
        },
        {
            email: 'oscartorres0396@gmail.com',
            password: 'Gignac10',
            businessName: 'Clínica del Doctor Verde',
            type: 'other',
            ownerName: 'Oscar Torres',
        },
    ];

    // Create Owner if not exists
    let owner = await usersService.findByEmail('owner@bookpro.com');
    if (!owner) {
        const password_hash = await bcrypt.hash('admin2025', 10);
        owner = await usersService.create({
            email: 'owner@bookpro.com',
            name: 'BookPro Owner',
            password_hash,
            role: UserRole.Owner,
        });
    }
    const ownerAuth = { userId: owner._id.toString(), role: UserRole.Owner };

    for (const data of qaData) {
        console.log(`Processing ${data.businessName}...`);

        // Check if business already exists to avoid duplicates
        const allBusinesses: any[] = await businessesService.findAll(ownerAuth);
        let business = allBusinesses.find((b: any) => b.name === data.businessName);

        if (!business) {
            console.log(`Creating business and user for ${data.businessName}...`);
            // businessesService.create handles user creation if email doesn't exist
            const result = await businessesService.create({
                name: data.businessName,
                businessName: data.businessName,
                address: 'Test Address 123',
                ownerName: data.ownerName,
                email: data.email,
                ownerPassword: data.password,
                type: data.type,
                subscriptionStatus: 'active',
            }, ownerAuth);
            business = result.business;
        } else {
            console.log(`Business ${data.businessName} already exists.`);
            // Ensure user password is correct if user exists
            const user = await usersService.findByEmail(data.email);
            if (user) {
                const password_hash = await bcrypt.hash(data.password, 10);
                await usersService.update(user._id.toString(), { password_hash });
                console.log(`Updated password for ${data.email}`);
            }
        }

        const businessId = business._id.toString();

        // Create Services if none exist
        const services: any[] = await servicesService.findAll(ownerAuth);
        const businessServices = services.filter((s: any) => s.businessId === businessId);

        if (businessServices.length === 0) {
            console.log(`Creating services for ${data.businessName}...`);
            const templates = serviceTemplatesByType[data.type] || serviceTemplatesByType.other;
            for (const template of templates) {
                await servicesService.create({
                    ...template,
                    active: true,
                    businessId,
                }, ownerAuth);
            }
        }
    }

    console.log('✅ QA Seed completed');
    await app.close();
}

bootstrap().catch((err) => {
    console.error('QA Seed failed', err);
    process.exit(1);
});
