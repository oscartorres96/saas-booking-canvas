
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ProductsService } from '../products/products.service';
import { ServicesService } from '../services/services.service';
import { ProductType } from '../products/schemas/product.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const businessesService = app.get(BusinessesService);
    const productsService = app.get(ProductsService);
    const servicesService = app.get(ServicesService);

    const email = 'chivaton60@gmail.com';
    const fakeAuthUser = { userId: 'system', role: 'owner' }; // Simulate owner/admin access

    console.log(`\n--- CLINIC SETUP SCRIPT ---\n`);
    console.log(`Searching for admin user: ${email}...`);

    const user = await usersService.findByEmail(email);

    if (!user) {
        console.error(`ERROR: User with email ${email} NOT FOUND.`);
        console.log('Stopping execution.');
        await app.close();
        process.exit(1);
    }

    console.log(`User found (ID: ${user._id}). Checking business...`);

    if (!user.businessId) {
        console.error(`ERROR: User has no businessId linked.`);
        await app.close();
        process.exit(1);
    }

    let business;
    try {
        business = await businessesService.findOne(user.businessId, fakeAuthUser);
    } catch (e) {
        console.error(`ERROR: Business with ID ${user.businessId} not found.`);
        await app.close();
        process.exit(1);
    }

    console.log(`Business found: ${business.name} (ID: ${business._id})`);

    // --- Step 2: Configure Payments ---
    console.log(`\nConfiguring Payment Policy...`);

    // Update Payment Config
    // We want:
    // - paymentPolicy: 'PACKAGES'
    // - allowTransfer: false
    // - allowCash: false
    // - stripeIntermediated (read-only), so ensure stripeConnectAccountId is empty.

    // Note: 'allowOnlinePayments' is not in the schema explicitly but implied by paymentMode BOOKPRO_COLLECTS.
    // We will set flags found in schema.

    const paymentConfigUpdate = {
        paymentPolicy: 'PACKAGES',
        allowTransfer: false,
        allowCash: false,
        method: 'none',
        // Force reset of connection to ensure INTERMEDIATED
        stripeConnectAccountId: '',
    };

    const updatedBusiness = await businessesService.updatePaymentConfig(
        business._id.toString(),
        paymentConfigUpdate,
        fakeAuthUser
    );

    console.log(`Payment Config Updated.`);
    console.log(`Policy: ${updatedBusiness.paymentConfig?.paymentPolicy}`);
    console.log(`Payment Mode: ${updatedBusiness.paymentMode}`);
    console.log(`Stripe Connect ID: ${updatedBusiness.stripeConnectAccountId || '(empty)'}`);

    if (updatedBusiness.paymentMode !== 'BOOKPRO_COLLECTS') {
        console.warn(`WARNING: Payment model is ${updatedBusiness.paymentMode}, expected BOOKPRO_COLLECTS.`);
    }

    // --- Step 3: Create Packages ---
    console.log(`\nChecking Services for Packages...`);
    // Get all services to associate with packages
    const services = await servicesService.findAll(fakeAuthUser, business._id.toString());
    const serviceIds = services.map(s => s._id.toString());

    if (serviceIds.length === 0) {
        console.warn('WARNING: No services found for this business. Packages will have empty allowedServiceIds.');
    } else {
        console.log(`Found ${serviceIds.length} services to link.`);
    }

    console.log(`\nCreating/Verifying Packages...`);

    const packagesToCreate = [
        {
            name: 'Paquete 10 Clases',
            type: ProductType.Package,
            totalUses: 10,
            validityDays: 20,
            price: 800,
            currency: 'MXN',
            visible: true,
            allowOnlinePurchase: true, // Not in schema? 'active' is.
            isUnlimited: false,
            allowedServiceIds: serviceIds,
            active: true
        },
        {
            name: 'Paquete 15 Clases',
            type: ProductType.Package,
            totalUses: 15,
            validityDays: 30,
            price: 975,
            currency: 'MXN',
            visible: true,
            active: true,
            isUnlimited: false,
            allowedServiceIds: serviceIds,
        },
        {
            name: 'Paquete 20 Clases',
            type: ProductType.Package,
            totalUses: 20,
            validityDays: 45,
            price: 1100,
            currency: 'MXN',
            visible: true,
            active: true,
            isUnlimited: false,
            allowedServiceIds: serviceIds,
        },
        {
            name: 'Paquete Ilimitado 30 días',
            type: ProductType.Package,
            isUnlimited: true,
            totalUses: 0,
            validityDays: 30,
            price: 1500,
            currency: 'MXN',
            visible: true,
            active: true,
            allowedServiceIds: serviceIds,
        }
    ];

    const currentProducts = await productsService.findAll(business._id.toString());

    for (const pkg of packagesToCreate) {
        // Check if package exists by name
        const exists = currentProducts.find(p => p.name === pkg.name && p.type === ProductType.Package && p.active);

        if (exists) {
            console.log(`Package "${pkg.name}" already exists. Skipping.`);
        } else {
            console.log(`Creating package "${pkg.name}"...`);
            await productsService.create(business._id.toString(), pkg);
            console.log(`Created.`);
        }
    }

    console.log(`\n--- SETUP COMPLETE ---`);
    await app.close();
    process.exit(0);
}

bootstrap();
