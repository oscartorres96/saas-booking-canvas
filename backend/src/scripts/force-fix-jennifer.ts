import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

async function forceFixJennifer() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const subscriptionModel = app.get<Model<any>>(getModelToken('Subscription'));

    const email = 'jennifermbm14@gmail.com';
    console.log(`🔍 Forzando actualización para ${email}...`);

    const sub = await subscriptionModel.findOne({
        stripeSubscriptionId: 'sub_1SflUELTjo7hhI0NVGY8uiKO'
    });

    if (!sub) {
        console.error('❌ No se encontró la suscripción en la BD');
        await app.close();
        return;
    }

    // Valores reales según lo configurado en Stripe y la interfaz
    const priceId = 'price_1SfCuCLTjo7hhl0NqCZMtoSR'; // ID del paquete de 1 peso
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(now.getDate() + 30); // 30 días desde hoy

    sub.priceId = priceId;
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = periodEnd;
    sub.status = 'active';

    await sub.save();
    console.log(`✅ ¡Jennifer arreglada localmente!`);
    console.log(`   - Nuevo Price ID: ${priceId}`);
    console.log(`   - Próximo Pago: ${periodEnd.toLocaleDateString()}`);

    await app.close();
}

forceFixJennifer();
