import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { sendEmail } from '../utils/email';
// TODO: Descomentar cuando Meta apruebe los mensajes de WhatsApp
// import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  appointmentReminderTemplate,
  businessNewBookingTemplate,
  clientBookingConfirmationTemplate,
  clientCancellationTemplate,
  clientBookingCompletedTemplate,
  demoRequestTemplate,
  businessRegistrationReceiptTemplate,
  demoRequestReceiptTemplate,
  DemoRequestData,
} from '../utils/email-templates';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Booking } from '../bookings/schemas/booking.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
    // TODO: Descomentar cuando Meta apruebe los mensajes de WhatsApp
    // private readonly whatsappService: WhatsappService,
  ) { }

  /** Obtiene la informacion del negocio */
  private async getBusinessInfo(businessId: string): Promise<Business | null> {
    return this.businessModel.findById(businessId).lean();
  }

  /** Formatea la fecha y hora de la reserva */
  private formatScheduledDate(date: Date, locale: string = 'es-MX'): string {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  /** Verifica si la fecha de la cita es el mismo dia (en la zona del servidor) */
  private isSameDay(date: Date): boolean {
    const target = new Date(date);
    const now = new Date();
    return (
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate()
    );
  }

  /** Envia notificaciones de nueva reserva al cliente y al negocio */
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    try {
      const business = booking.businessId
        ? await this.getBusinessInfo(booking.businessId)
        : null;

      const businessName = business?.name || business?.businessName || 'Nuestro Negocio';
      const language = business?.language || 'es';
      const locale = language === 'en' ? 'en-US' : 'es-MX';
      const scheduledDate = new Date(booking.scheduledAt);
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt, locale);
      const showReminder = !this.isSameDay(scheduledDate);

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
          showReminder,
          language,
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
          language,
        });

        await sendEmail({
          to: business.email,
          subject: `Nueva reserva - ${booking.clientName}`,
          html: businessHtml,
        });
      }

      // TODO: Descomentar cuando Meta apruebe los mensajes de WhatsApp
      // --- WhatsApp Notification ---
      /* if (booking.clientPhone) {
        try {
          // Basic phone number cleaning (remove + and spaces)
          const cleanPhone = booking.clientPhone.replace(/[\+\s]/g, '');

          await this.whatsappService.sendTemplateMessage(
            cleanPhone,
            'booking_confirmation', // Template name in Meta
            [
              booking.clientName,   // Variable {{1}}: Client Name
              businessName,         // Variable {{2}}: Business Name
              booking.serviceName || 'Servicio', // Variable {{3}}: Service
              scheduledAt           // Variable {{4}}: Date & Time
            ],
            business?.settings?.language || 'es_MX'
          );
        } catch (waError: any) {
          console.error('Error enviando WhatsApp de confirmación:', waError.message);
          // Don't block the flow if WhatsApp fails
        }
      } */
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
      const language = business?.language || 'es';
      const locale = language === 'en' ? 'en-US' : 'es-MX';
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt, locale);

      const html = clientCancellationTemplate({
        businessName,
        clientName: booking.clientName,
        serviceName: booking.serviceName || 'Servicio',
        scheduledAt,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        language,
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

      if (this.isSameDay(booking.scheduledAt)) {
        console.log('No se envia recordatorio: la cita es el mismo dia');
        return;
      }

      const business = booking.businessId
        ? await this.getBusinessInfo(booking.businessId)
        : null;

      const businessName = business?.name || business?.businessName || 'Nuestro Negocio';
      const language = business?.language || 'es';
      const locale = language === 'en' ? 'en-US' : 'es-MX';
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt, locale);

      const html = appointmentReminderTemplate({
        businessName,
        clientName: booking.clientName,
        serviceName: booking.serviceName || 'Servicio',
        scheduledAt,
        accessCode: booking.accessCode,
        notes: booking.notes,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        language,
      });

      await sendEmail({
        to: booking.clientEmail,
        subject: `Recordatorio de cita - ${businessName}`,
        html,
      });

      // TODO: Descomentar cuando Meta apruebe los mensajes de WhatsApp
      // --- WhatsApp Reminder ---
      /* if (booking.clientPhone) {
        try {
          const cleanPhone = booking.clientPhone.replace(/[\+\s]/g, '');

          await this.whatsappService.sendTemplateMessage(
            cleanPhone,
            'appointment_reminder', // Template name in Meta
            [
              booking.clientName,   // Variable {{1}}: Client Name
              businessName,         // Variable {{2}}: Business Name
              booking.serviceName || 'Servicio', // Variable {{3}}: Service
              scheduledAt           // Variable {{4}}: Date & Time
            ],
            business?.settings?.language || 'es_MX'
          );
        } catch (waError: any) {
          console.error('Error enviando WhatsApp de recordatorio:', waError.message);
        }
      } */

    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
    }
  }

  /** Envia notificacion de agradecimiento al completar cita */
  async sendBookingCompletedNotification(booking: Booking): Promise<void> {
    try {
      if (!booking.clientEmail) {
        return;
      }

      const business = booking.businessId
        ? await this.getBusinessInfo(booking.businessId)
        : null;

      const businessName = business?.name || business?.businessName || 'Nuestro Negocio';
      const language = business?.language || 'es';
      const locale = language === 'en' ? 'en-US' : 'es-MX';
      const scheduledAt = this.formatScheduledDate(booking.scheduledAt, locale);

      const html = clientBookingCompletedTemplate({
        businessName,
        clientName: booking.clientName,
        serviceName: booking.serviceName || 'Servicio',
        scheduledAt,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        language,
      });

      await sendEmail({
        to: booking.clientEmail,
        subject: `¡Gracias por tu visita! - ${businessName}`,
        html,
      });
    } catch (error) {
      console.error('Error al enviar agradecimiento:', error);
    }
  }

  /** Envia notificacion de solicitud de demo */
  async sendDemoRequestNotification(data: DemoRequestData): Promise<void> {
    try {
      // 1. Send Admin Notification
      const adminHtml = demoRequestTemplate(data);
      // Use specific admin email or fallback
      const adminEmail = process.env.ADMIN_EMAIL || 'oscartorres0396@gmail.com';

      await sendEmail({
        to: adminEmail,
        subject: `Nueva Solicitud de Demo - ${data.name}`,
        html: adminHtml,
      });

      // 2. Send Applicant Confirmation
      if (data.email) {
        const applicantHtml = demoRequestReceiptTemplate(data);
        await sendEmail({
          to: data.email,
          subject: 'Hemos recibido tu solicitud de demo - BookPro',
          html: applicantHtml,
        });
      }
    } catch (error) {
      console.error('Error sending demo request notification', error);
    }
  }

  /** Envia notificacion de solicitud de registro de negocio */
  async sendBusinessRegistrationNotification(data: DemoRequestData): Promise<void> {
    try {
      // 1. Send Admin Notification
      const adminHtml = demoRequestTemplate(data);
      // Use specific admin email or fallback
      const adminEmail = process.env.ADMIN_EMAIL || 'oscartorres0396@gmail.com';

      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `Nueva Solicitud de Registro de Negocio - ${data.name}`,
          html: adminHtml,
        });
      } else {
        console.error('No admin email configured for business registration requests');
      }

      // 2. Send Applicant Confirmation
      if (data.email) {
        const applicantHtml = businessRegistrationReceiptTemplate(data);
        await sendEmail({
          to: data.email,
          subject: 'Hemos recibido tu solicitud - BookPro',
          html: applicantHtml,
        });
      }

    } catch (error) {
      console.error('Error sending business registration notification', error);
    }
  }

  /** Envia email de activación de cuenta */
  async sendAccountActivationEmail(data: {
    email: string;
    name: string;
    activationToken: string;
    temporaryPassword: string;
    accessType: 'trial' | 'paid';
  }): Promise<void> {
    try {
      const { email, name, activationToken, temporaryPassword, accessType } = data;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const activationLink = `${frontendUrl}/activate/${activationToken}`;

      const accessTypeText = accessType === 'trial'
        ? 'acceso de prueba por 14 días'
        : 'acceso con suscripción';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">¡Bienvenido a BookPro!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Tu cuenta ha sido creada</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Hola <strong>${name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                ¡Excelentes noticias! Tu solicitud ha sido aprobada y tu cuenta de BookPro está lista para ser activada con <strong>${accessTypeText}</strong>.
              </p>

              <!-- Credenciales Box -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Credenciales de Acceso Temporales</h3>
                <p style="margin: 8px 0; color: #555555;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0; color: #555555;"><strong>Contraseña Temporal:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 3px; font-family: monospace;">${temporaryPassword}</code></p>
              </div>

              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Para activar tu cuenta y establecer tu contraseña personalizada, haz clic en el botón de abajo:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Activar Mi Cuenta
                </a>
              </div>

              <!-- Important Notes -->
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  ⚠️ <strong>Importante:</strong> Este enlace expira en 48 horas. Por favor activa tu cuenta cuanto antes.
                </p>
              </div>

              <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${activationLink}" style="color: #667eea; word-break: break-all;">${activationLink}</a>
              </p>

              <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 20px;">
                Si no solicitaste esta cuenta, puedes ignorar este mensaje.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">
                © 2024 BookPro. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d;">
                <a href="mailto:oscartorres0396@gmail.com" style="color: #667eea; text-decoration: none;">Contáctanos</a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: email,
        subject: '🎉 Tu cuenta BookPro está lista - Actívala ahora',
        html,
      });

    } catch (error) {
      console.error('Error sending account activation email:', error);
      throw error;
    }
  }
}
