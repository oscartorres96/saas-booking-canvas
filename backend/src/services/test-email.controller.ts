import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationService } from '../services/notification.service';
import { CronService } from '../services/cron.service';
import { Booking } from '../bookings/schemas/booking.schema';

/**
 * TESTING CONTROLLER - Solo para desarrollo
 * Permite probar los emails manualmente sin crear reservas reales
 * 
 * IMPORTANTE: Elimina o comenta este controlador en producción
 */

@Controller('test-email')
export class TestEmailController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly cronService: CronService
    ) { }

    /**
     * Probar email de confirmación de reserva
     * POST /test-email/booking-confirmation
     */
    @UseGuards(JwtAuthGuard)
    @Post('booking-confirmation')
    async testBookingConfirmation(@Body() body: any) {
        const mockBooking: Partial<Booking> = {
            clientName: body.clientName || 'Juan Pérez',
            clientEmail: body.clientEmail || 'test@example.com',
            clientPhone: body.clientPhone || '+52 123 456 7890',
            serviceName: body.serviceName || 'Corte de Cabello',
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            businessId: body.businessId,
            accessCode: '123456',
            notes: body.notes || 'Esta es una reserva de prueba',
        };

        await this.notificationService.sendBookingConfirmation(mockBooking as Booking);

        return {
            message: 'Email de confirmación enviado',
            sentTo: mockBooking.clientEmail,
        };
    }

    /**
     * Probar email de cancelación
     * POST /test-email/cancellation
     */
    @UseGuards(JwtAuthGuard)
    @Post('cancellation')
    async testCancellation(@Body() body: any) {
        const mockBooking: Partial<Booking> = {
            clientName: body.clientName || 'Juan Pérez',
            clientEmail: body.clientEmail || 'test@example.com',
            serviceName: body.serviceName || 'Corte de Cabello',
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            businessId: body.businessId,
        };

        await this.notificationService.sendCancellationNotification(mockBooking as Booking);

        return {
            message: 'Email de cancelación enviado',
            sentTo: mockBooking.clientEmail,
        };
    }

    /**
     * Probar email de recordatorio
     * POST /test-email/reminder
     */
    @UseGuards(JwtAuthGuard)
    @Post('reminder')
    async testReminder(@Body() body: any) {
        const mockBooking: Partial<Booking> = {
            clientName: body.clientName || 'Juan Pérez',
            clientEmail: body.clientEmail || 'test@example.com',
            clientPhone: body.clientPhone || '+52 123 456 7890',
            serviceName: body.serviceName || 'Corte de Cabello',
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            businessId: body.businessId,
            accessCode: '123456',
            notes: body.notes,
        };

        await this.notificationService.sendAppointmentReminder(mockBooking as Booking);

        return {
            message: 'Email de recordatorio enviado',
            sentTo: mockBooking.clientEmail,
        };
    }

    /**
     * Ejecutar manualmente el cron de recordatorios
     * POST /test-email/trigger-reminders
     */
    @UseGuards(JwtAuthGuard)
    @Post('trigger-reminders')
    async triggerReminders() {
        await this.cronService.triggerRemindersManually();

        return {
            message: 'Cron job de recordatorios ejecutado manualmente',
        };
    }
}
