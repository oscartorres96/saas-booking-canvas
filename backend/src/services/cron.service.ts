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
    private readonly notificationService: NotificationService,
  ) { }

  onModuleInit() {
    const emailConfigured = (process.env.SMTP_USER && process.env.SMTP_PASS) ||
      (process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (!emailConfigured) {
      console.warn('[cron] Servicio de email no configurado. Recordatorios deshabilitados.');
      return;
    }

    this.scheduleReminders();
    console.log('[cron] Tarea de recordatorios iniciada');
  }

  /**
   * Programa el envio de recordatorios.
   * Ejecuta cada hora para buscar citas que ocurran en ~24 horas.
   */
  private scheduleReminders() {
    cron.schedule('0 * * * *', async () => {
      console.log('[cron] Ejecutando tarea de recordatorios');
      await this.sendUpcomingReminders();
    });
  }

  /**
   * Busca y envia recordatorios para citas en las proximas 23-24 horas.
   */
  private async sendUpcomingReminders(): Promise<void> {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

      const upcomingBookings = await this.bookingModel.find({
        scheduledAt: {
          $gte: twentyThreeHoursFromNow,
          $lte: twentyFourHoursFromNow,
        },
        status: { $ne: BookingStatus.Cancelled },
      }).lean();

      console.log(`[cron] ${upcomingBookings.length} citas para recordar`);

      for (const booking of upcomingBookings) {
        if (booking.clientEmail) {
          await this.notificationService.sendAppointmentReminder(booking);
          console.log(`[cron] Recordatorio enviado a ${booking.clientEmail}`);
        }
      }
    } catch (error) {
      console.error('[cron] Error al enviar recordatorios:', error);
    }
  }

  /** Metodo manual para testing */
  async triggerRemindersManually(): Promise<void> {
    console.log('[cron] Ejecucion manual de recordatorios');
    await this.sendUpcomingReminders();
  }
}
