import { NestFactory } from '@nestjs/core';
import mongoose from 'mongoose';
import { AppModule } from '../app.module';
import { BusinessesService } from '../businesses/businesses.service';
import { ServicesService } from '../services/services.service';

/**
 * Script para configurar el Caso 2.1:
 * - Servicio con pago de $1 MXN
 * - PaymentMode = BOOKPRO_COLLECTS
 * - Negocio SIN Stripe Connect
 */
async function configureCase21() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const businessesService = app.get(BusinessesService);
    const servicesService = app.get(ServicesService);

    // Mock admin user for system operations
    const mockAdminUser = { userId: 'system_seed', role: 'owner' };

    try {
        console.log('🔧 Configurando Caso 2.1...\n');

        // 1. Buscar el negocio "Clinica de Oscar"
        const businessId = '6941cf07956e9c7046a13829';
        const business = await businessesService.findOne(businessId, mockAdminUser);

        if (!business) {
            throw new Error('Negocio no encontrado');
        }

        console.log(`✅ Negocio encontrado: ${business.name} (${business._id})`);

        // 2. Verificar/configurar el modo de pago
        if (business.stripeConnectAccountId) {
            console.log('⚠️  El negocio tiene Stripe Connect configurado. Limpiando...');
            await businessesService.updatePaymentConfig(businessId, {
                stripeConnectAccountId: null,
            }, mockAdminUser);
            console.log('✅ Stripe Connect removido, modo cambiado a BOOKPRO_COLLECTS');
        } else {
            console.log(`✅ PaymentMode actual: ${business.paymentMode || 'BOOKPRO_COLLECTS'} (correcto)`);
        }

        // 3. Configurar política de pago
        // 3. Configurar política de pago
        await businessesService.updatePaymentConfig(businessId, {
            paymentPolicy: 'PAY_BEFORE_BOOKING',
            allowCash: false,
        }, mockAdminUser);
        console.log('✅ Política de pago configurada: PAY_BEFORE_BOOKING');

        // 4. Buscar o crear el servicio "Test $1"
        // 4. Buscar o crear el servicio "Test $1"
        const services = await servicesService.findAll(mockAdminUser, businessId);
        let testService = services.find(s => s.name.includes('Test'));

        if (testService) {
            console.log(`\n📝 Actualizando servicio existente: ${testService.name} (${testService._id})`);
            await servicesService.update(testService._id.toString(), {
                name: 'Test $1',
                price: 1,
                durationMinutes: 60,
                description: 'Servicio de prueba para Caso 2.1 - $1 MXN',
                requireProduct: false,
                active: true,
            }, mockAdminUser);
            console.log('✅ Servicio actualizado: Test $1 por $1 MXN');
        } else {
            console.log('\n📝 Creando nuevo servicio Test $1...');
            testService = await servicesService.create({
                name: 'Test $1',
                businessId,
                price: 1,
                durationMinutes: 60,
                description: 'Servicio de prueba para Caso 2.1 - $1 MXN',
                requireProduct: false,
                active: true,
            } as any, mockAdminUser);
            console.log('✅ Servicio creado: Test $1 por $1 MXN');
        }

        // 5. Verificar configuración final
        // 5. Verificar configuración final
        const updatedBusiness = await businessesService.findOne(businessId, mockAdminUser);
        console.log('\n📊 CONFIGURACIÓN FINAL:');
        console.log('=======================');
        console.log(`Negocio: ${updatedBusiness.name}`);
        console.log(`PaymentMode: ${updatedBusiness.paymentMode || 'BOOKPRO_COLLECTS'}`);
        console.log(`Stripe Connect: ${updatedBusiness.stripeConnectAccountId ? 'SÍ ❌' : 'NO ✅'}`);
        console.log(`Payment Policy: ${updatedBusiness.paymentConfig?.paymentPolicy || 'N/A'}`);
        console.log(`Servicio: ${testService.name} - $${testService.price} MXN`);
        console.log('=======================\n');

        console.log('⚠️  NOTA IMPORTANTE:');
        console.log('Stripe requiere un mínimo de $10 MXN para pagos.');
        console.log('El servicio está configurado en $1 MXN como solicitado,');
        console.log('pero la transacción fallará con un error 400 de Stripe.');
        console.log('Para pruebas reales, considera cambiar el precio a $10 MXN.\n');

        console.log('✅ Configuración del Caso 2.1 completada exitosamente');

    } catch (error) {
        console.error('❌ Error:', (error as any).message);
        throw error;
    } finally {
        await mongoose.disconnect();
        await app.close();
    }
}

configureCase21()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
