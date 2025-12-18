import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';

async function fixJenniferSubscription() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const subscriptionModel = app.get<Model<any>>(getModelToken('Subscription'));

    // In NestJS, we should get the config service or just use process.env
    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    const stripe = new Stripe(stripeSecret, {
        apiVersion: '2025-11-17.clover' as any,
    });

    const email = 'jennifermbm14@gmail.com';
    console.log(`🔍 Buscando suscripción para ${email}...`);

    const sub = await subscriptionModel.findOne({
        stripeSubscriptionId: 'sub_1SflUELTjo7hhI0NVGY8uiKO'
    });

    if (!sub) {
        console.error('❌ No se encontró la suscripción en la BD');
        await app.close();
        return;
    }

    try {
        console.log(`📡 Consultando Stripe para la suscripción sub_1SflUELTjo7hhI0NVGY8uiKO...`);
        const stripeSub = await stripe.subscriptions.retrieve('sub_1SflUELTjo7hhI0NVGY8uiKO') as any;

        const priceId = stripeSub.items.data[0].price.id;
        const periodStart = new Date(stripeSub.current_period_start * 1000);
        const periodEnd = new Date(stripeSub.current_period_end * 1000);

        console.log(`✅ Datos encontrados en Stripe:`);
        console.log(`   - Price ID: ${priceId}`);
        console.log(`   - Period Start: ${periodStart}`);
        console.log(`   - Period End: ${periodEnd}`);

        sub.priceId = priceId;
        sub.currentPeriodStart = periodStart;
        sub.currentPeriodEnd = periodEnd;
        sub.status = 'active';

        await sub.save();
        console.log(`🚀 BD actualizada con éxito para Jennifer.`);

    } catch (error: any) {
        console.error('❌ Error al consultar Stripe o guardar en BD:', error.message);
    }

    await app.close();
}

fixJenniferSubscription();
