import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../stripe/schemas/subscription.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Payment, PaymentDocument } from '../stripe/schemas/payment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

/**
 * Script para sincronizar manualmente la suscripción de Jennifer desde Stripe a MongoDB
 * 
 * Ejecutar: npx ts-node src/scripts/sync-jennifer-subscription.ts
 */

async function syncJenniferSubscription() {
    console.log('🔄 Iniciando sincronización de suscripción de Jennifer...\n');

    const app = await NestFactory.createApplicationContext(AppModule);

    const subscriptionModel = app.get<Model<SubscriptionDocument>>(
        getModelToken(Subscription.name),
    );
    const businessModel = app.get<Model<BusinessDocument>>(
        getModelToken(Business.name),
    );
    const paymentModel = app.get<Model<PaymentDocument>>(
        getModelToken(Payment.name),
    );
    const userModel = app.get<Model<UserDocument>>(
        getModelToken(User.name),
    );

    try {
        // Datos de Jennifer desde Stripe
        const stripeCustomerId = 'cus_TGdboQU53lkm';
        const stripeSubscriptionId = 'sub_1QhXkk1JUJm7nRMNJarfMN';
        const email = 'jennifermbm14@gmail.com';

        console.log('📧 Buscando usuario por email:', email);

        // Buscar usuario de Jennifer
        const user = await userModel.findOne({ email });
        if (!user) {
            console.error('❌ Usuario no encontrado con email:', email);
            console.log('💡 Busca el usuario manualmente en MongoDB y actualiza el email en este script.');
            await app.close();
            return;
        }

        console.log('✅ Usuario encontrado:', user.name);
        console.log('   - User ID:', user._id);
        console.log('   - Business ID:', user.businessId);

        if (!user.businessId) {
            console.error('❌ El usuario no tiene businessId asociado');
            await app.close();
            return;
        }

        // Buscar negocio
        const business = await businessModel.findById(user.businessId);
        if (!business) {
            console.error('❌ Negocio no encontrado con ID:', user.businessId);
            await app.close();
            return;
        }

        console.log('✅ Negocio encontrado:', business.name);
        console.log('   - Subscription Status actual:', business.subscriptionStatus);

        // Verificar si ya existe la suscripción
        const existingSub = await subscriptionModel.findOne({
            businessId: String(user.businessId),
            userId: String(user._id),
        });

        if (existingSub) {
            console.log('\n⚠️  Ya existe una suscripción para este negocio');
            console.log('   Actualizando...');

            existingSub.stripeCustomerId = stripeCustomerId;
            existingSub.stripeSubscriptionId = stripeSubscriptionId;
            existingSub.status = 'active';
            existingSub.priceId = 'price_1QPQCzQ12nTJiBYkCz7nnDsR'; // ID del producto "un peso"
            existingSub.currentPeriodStart = new Date('2024-12-17');
            existingSub.currentPeriodEnd = new Date('2026-01-17');
            await existingSub.save();

            console.log('✅ Suscripción actualizada');
        } else {
            console.log('\n📝 Creando nueva suscripción...');

            await subscriptionModel.create({
                userId: String(user._id),
                businessId: String(user.businessId),
                stripeCustomerId,
                stripeSubscriptionId,
                priceId: 'price_1QPQCzQ12nTJiBYkCz7nnDsR', // ID del producto "un peso"
                status: 'active',
                currentPeriodStart: new Date('2024-12-17'),
                currentPeriodEnd: new Date('2026-01-17'),
            });

            console.log('✅ Suscripción creada en MongoDB');
        }

        // Actualizar estado de subscripción del negocio
        business.subscriptionStatus = 'active';
        await business.save();

        console.log('✅ Estado del negocio actualizado a "active"');

        // Verificar si ya existe registro de pago
        const existingPayment = await paymentModel.findOne({
            businessId: String(user.businessId),
            stripePaymentIntentId: { $exists: true },
        });

        if (!existingPayment) {
            console.log('\n💰 Creando registro de pago inicial...');

            await paymentModel.create({
                businessId: String(user.businessId),
                userId: String(user._id),
                amount: 100, // $1.00 MXN = 100 centavos
                currency: 'mxn',
                status: 'paid',
                description: 'Suscripción "un peso" - Sincronización manual',
                createdAt: new Date('2024-12-17'),
            });

            console.log('✅ Registro de pago creado');
        } else {
            console.log('ℹ️  Ya existe un registro de pago');
        }

        console.log('\n✨ ¡Sincronización completada exitosamente!');
        console.log('\n📊 Resumen:');
        console.log('   - Usuario:', user.name, `(${user.email})`);
        console.log('   - Negocio:', business.name);
        console.log('   - Subscription ID:', stripeSubscriptionId);
        console.log('   - Customer ID:', stripeCustomerId);
        console.log('   - Estado:', 'active');
        console.log('   - Próxima factura:', 'Jan 17, 2026');
        console.log('\n🎉 Jennifer ahora puede acceder a su dashboard sin problemas!');

    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
        throw error;
    } finally {
        await app.close();
    }
}

// Ejecutar el script
syncJenniferSubscription()
    .then(() => {
        console.log('\n✅ Script finalizado correctamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });
