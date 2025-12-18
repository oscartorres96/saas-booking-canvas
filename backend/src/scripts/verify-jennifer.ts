import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Subscription, SubscriptionDocument } from '../stripe/schemas/subscription.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

/**
 * Script para verificar la suscripción de Jennifer
 */

async function verifyJenniferSubscription() {
    console.log('🔍 Verificando suscripción de Jennifer...\n');

    const app = await NestFactory.createApplicationContext(AppModule);

    const subscriptionModel = app.get<Model<SubscriptionDocument>>(
        getModelToken(Subscription.name),
    );
    const businessModel = app.get<Model<BusinessDocument>>(
        getModelToken(Business.name),
    );
    const userModel = app.get<Model<UserDocument>>(
        getModelToken(User.name),
    );

    try {
        const email = 'jennifermbm14@gmail.com';

        // Buscar usuario
        const user = await userModel.findOne({ email });
        if (!user) {
            console.error('❌ Usuario no encontrado');
            await app.close();
            return;
        }

        console.log('👤 Usuario:');
        console.log('   - Nombre:', user.name);
        console.log('   - Email:', user.email);
        console.log('   - User ID:', user._id);
        console.log('   - Business ID:', user.businessId);

        // Buscar negocio
        const business = await businessModel.findById(user.businessId);
        if (business) {
            console.log('\n🏢 Negocio:');
            console.log('   - Nombre:', business.name);
            console.log('   - Subscription Status:', business.subscriptionStatus);
        }

        // Buscar suscripción
        const subscription = await subscriptionModel.findOne({
            businessId: String(user.businessId),
        });

        if (subscription) {
            console.log('\n💳 Suscripción:');
            console.log('   - Status:', subscription.status);
            console.log('   - Stripe Customer ID:', subscription.stripeCustomerId);
            console.log('   - Stripe Subscription ID:', subscription.stripeSubscriptionId);
            console.log('   - Price ID:', subscription.priceId);
            console.log('   - Period Start:', subscription.currentPeriodStart);
            console.log('   - Period End:', subscription.currentPeriodEnd);
            console.log('\n✅ ¡Suscripción configurada correctamente!');
        } else {
            console.log('\n❌ No se encontró suscripción');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await app.close();
    }
}

verifyJenniferSubscription()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
