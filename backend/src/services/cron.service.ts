import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { NotificationService } from './notification.service';

@Injectable()
export class CronService implements OnModuleInit {
    constructor(
        @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
        private readonly notificationService: NotificationService
    ) { }

    onModuleInit() {
        // Verifica si el servicio de email está configurado
        const emailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

        if (!emailConfigured) {
            console.warn('⚠️  Servicio de email no configurado. Los recordatorios automáticos están deshabilitados.');
            return;
        }

        // Ejecutar cada hora para enviar recordatorios
        // En producción, podrías querer ajustar la frecuencia
        this.scheduleReminders();
        console.log('✅ Cron job de recordatorios iniciado');
    }

    /**
     * Programa el envío de recordatorios
     * Se ejecuta cada hora para buscar citas que sean en 24 horas
     */
    private scheduleReminders() {
        // Ejecutar cada hora: '0 * * * *'
        // Para testing, puedes usar '* * * * *' (cada minuto)
        cron.schedule('0 * * * *', async () => {
            console.log('🔔 Ejecutando tarea de recordatorios...');
            await this.sendUpcomingReminders();
        });
    }

    /**
     * Busca y envía recordatorios para citas en las próximas 24 horas
     */
    private async sendUpcomingReminders(): Promise<void> {
        try {
            const now = new Date();
            const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

            // Buscar reservas que sean entre 23 y 24 horas desde ahora
            // y que no estén canceladas
            const upcomingBookings = await this.bookingModel.find({
                scheduledAt: {
                    $gte: twentyThreeHoursFromNow,
                    $lte: twentyFourHoursFromNow,
                },
                status: { $ne: BookingStatus.Cancelled },
            }).lean();

            console.log(`📋 Encontradas ${upcomingBookings.length} citas para recordar`);

            // Enviar recordatorios
            for (const booking of upcomingBookings) {
                if (booking.clientEmail) {
                    await this.notificationService.sendAppointmentReminder(booking);
                    console.log(`📧 Recordatorio enviado a ${booking.clientEmail}`);
                }
            }

            if (upcomingBookings.length > 0) {
                console.log(`✅ Se enviaron ${upcomingBookings.length} recordatorios`);
            }
        } catch (error) {
            console.error('❌ Error al enviar recordatorios:', error);
        }
    }

    /**
     * Método para ejecutar manualmente el envío de recordatorios
     * Útil para testing
     */
    async triggerRemindersManually(): Promise<void> {
        console.log('🔧 Ejecución manual de recordatorios');
        await this.sendUpcomingReminders();
    }
}
