import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { sendEmail } from '../utils/email';
import {
  appointmentReminderTemplate,
  businessNewBookingTemplate,
  clientBookingConfirmationTemplate,
  clientCancellationTemplate,
} from '../utils/email-templates';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Booking } from '../bookings/schemas/booking.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
  ) { }

  /** Obtiene la informacion del negocio */
  private async getBusinessInfo(businessId: string): Promise<Business | null> {
    return this.businessModel.findById(businessId).lean();
  }

  /** Formatea la fecha y hora de la reserva */
  private formatScheduledDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  /** Envia notificaciones de nueva reserva al cliente y al negocio */
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    try {
      const business = booking.businessId
        ? await this.getBusinessInfo(booking.businessId)
        : null;

      const businessName = business?.name || business?.businessName || 'Nuestro Negocio';
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt);

      if (booking.clientEmail) {
        const clientHtml = clientBookingConfirmationTemplate({
          businessName,
          clientName: booking.clientName,
          serviceName: booking.serviceName || 'Servicio',
          scheduledAt,
          accessCode: booking.accessCode,
          notes: booking.notes,
          businessEmail: business?.email,
          businessPhone: business?.phone,
        });

        await sendEmail({
          to: booking.clientEmail,
          subject: `Reserva confirmada - ${businessName}`,
          html: clientHtml,
        });
      }

      if (business?.email) {
        const businessHtml = businessNewBookingTemplate({
          businessName,
          clientName: booking.clientName,
          serviceName: booking.serviceName || 'Servicio',
          scheduledAt,
          clientEmail: booking.clientEmail,
          clientPhone: booking.clientPhone,
          notes: booking.notes,
        });

        await sendEmail({
          to: business.email,
          subject: `Nueva reserva - ${booking.clientName}`,
          html: businessHtml,
        });
      }
    } catch (error) {
      console.error('Error al enviar confirmacion de reserva:', error);
    }
  }

  /** Envia notificacion de cancelacion al cliente */
  async sendCancellationNotification(booking: Booking): Promise<void> {
    try {
      if (!booking.clientEmail) {
        console.log('No se puede enviar notificacion de cancelacion: email del cliente no disponible');
        return;
      }

      const business = booking.businessId
        ? await this.getBusinessInfo(booking.businessId)
        : null;

      const businessName = business?.name || business?.businessName || 'Nuestro Negocio';
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt);

      const html = clientCancellationTemplate({
        businessName,
        clientName: booking.clientName,
        serviceName: booking.serviceName || 'Servicio',
        scheduledAt,
        businessEmail: business?.email,
        businessPhone: business?.phone,
      });

      await sendEmail({
        to: booking.clientEmail,
        subject: `Reserva cancelada - ${businessName}`,
        html,
      });
    } catch (error) {
      console.error('Error al enviar notificacion de cancelacion:', error);
    }
  }

  /** Envia recordatorio de cita (24 horas antes) */
  async sendAppointmentReminder(booking: Booking): Promise<void> {
    try {
      if (!booking.clientEmail) {
        console.log('No se puede enviar recordatorio: email del cliente no disponible');
        return;
      }

      const business = booking.businessId
        ? await this.getBusinessInfo(booking.businessId)
        : null;

      const businessName = business?.name || business?.businessName || 'Nuestro Negocio';
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt);

      const html = appointmentReminderTemplate({
        businessName,
        clientName: booking.clientName,
        serviceName: booking.serviceName || 'Servicio',
        scheduledAt,
        accessCode: booking.accessCode,
        notes: booking.notes,
        businessEmail: business?.email,
        businessPhone: business?.phone,
      });

      await sendEmail({
        to: booking.clientEmail,
        subject: `Recordatorio de cita - ${businessName}`,
        html,
      });
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
    }
  }
}
