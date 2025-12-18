import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../stripe/schemas/subscription.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Payment, PaymentDocument } from '../stripe/schemas/payment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

/**
 * Script para limpiar la suscripción de Jennifer y dejarla como antes
 * 
 * Ejecutar: npx ts-node src/scripts/clean-jennifer-subscription.ts
 */

async function cleanJenniferSubscription() {
    console.log('🧹 Limpiando suscripción de Jennifer...\n');

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
        const email = 'jennifermbm14@gmail.com';

        console.log('📧 Buscando usuario:', email);

        // Buscar usuario de Jennifer
        const user = await userModel.findOne({ email });
        if (!user) {
            console.error('❌ Usuario no encontrado con email:', email);
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
            console.error('❌ Negocio no encontrado');
            await app.close();
            return;
        }

        console.log('✅ Negocio encontrado:', business.name);

        // Eliminar suscripción
        const deletedSub = await subscriptionModel.deleteMany({
            businessId: String(user.businessId),
        });

        if (deletedSub.deletedCount > 0) {
            console.log('\n✅ Suscripción eliminada:', deletedSub.deletedCount, 'registro(s)');
        } else {
            console.log('\nℹ️  No se encontró suscripción para eliminar');
        }

        // Eliminar pagos
        const deletedPayments = await paymentModel.deleteMany({
            businessId: String(user.businessId),
        });

        if (deletedPayments.deletedCount > 0) {
            console.log('✅ Pagos eliminados:', deletedPayments.deletedCount, 'registro(s)');
        } else {
            console.log('ℹ️  No se encontraron pagos para eliminar');
        }

        // Restaurar estado del negocio a 'trial'
        business.subscriptionStatus = 'trial';
        await business.save();

        console.log('✅ Estado del negocio restaurado a "trial"');

        console.log('\n✨ ¡Limpieza completada exitosamente!');
        console.log('\n📊 Estado final:');
        console.log('   - Usuario:', user.name);
        console.log('   - Negocio:', business.name);
        console.log('   - Subscription Status:', business.subscriptionStatus);
        console.log('   - Suscripciones en MongoDB: 0');
        console.log('   - Pagos en MongoDB: 0');
        console.log('\n🎉 Jennifer puede volver a comprar el paquete!');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    } finally {
        await app.close();
    }
}

// Ejecutar el script
cleanJenniferSubscription()
    .then(() => {
        console.log('\n✅ Script finalizado correctamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });
