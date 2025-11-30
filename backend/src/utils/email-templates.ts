/**
 * Plantillas HTML para correos electrónicos.
 * Estilo moderno y limpio inspirado en shadcn/ui
 */

const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background-color: #f9fafb;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .email-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    padding: 32px 24px;
    text-align: center;
  }
  .email-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }
  .email-body {
    padding: 32px 24px;
  }
  .email-body h2 {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }
  .email-body p {
    margin: 0 0 16px 0;
    color: #4b5563;
  }
  .booking-details {
    background-color: #f3f4f6;
    border-radius: 8px;
    padding: 20px;
    margin: 24px 0;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .detail-row:last-child {
    border-bottom: none;
  }
  .detail-label {
    font-weight: 600;
    color: #374151;
  }
  .detail-value {
    color: #6b7280;
  }
  .button {
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    text-align: center;
    margin: 16px 0;
  }
  .button:hover {
    opacity: 0.9;
  }
  .email-footer {
    background-color: #f9fafb;
    padding: 24px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
  }
  .access-code {
    background-color: #dbeafe;
    border: 2px dashed #3b82f6;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    margin: 24px 0;
  }
  .access-code-label {
    font-size: 14px;
    color: #1e40af;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .access-code-value {
    font-size: 28px;
    font-weight: 700;
    color: #1e3a8a;
    letter-spacing: 4px;
    font-family: 'Courier New', monospace;
  }
  .alert {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 16px;
    margin: 24px 0;
    border-radius: 4px;
  }
  .alert-warning {
    background-color: #fffbeb;
    border-left-color: #f59e0b;
  }
  .alert-info {
    background-color: #eff6ff;
    border-left-color: #3b82f6;
  }
`;

interface BookingEmailData {
    businessName: string;
    clientName: string;
    serviceName: string;
    scheduledAt: string;
    accessCode?: string;
    notes?: string;
    businessEmail?: string;
    businessPhone?: string;
    clientEmail?: string;
    clientPhone?: string;
}

/**
 * Plantilla para confirmación de reserva al cliente
 */
export const clientBookingConfirmationTemplate = (data: BookingEmailData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>✅ Reserva Confirmada</h1>
    </div>
    <div class="email-body">
      <h2>¡Hola ${data.clientName}! 👋</h2>
      <p>Tu reserva ha sido confirmada exitosamente. A continuación encontrarás los detalles:</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Servicio:</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Negocio:</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">Código de Acceso</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 12px; font-size: 14px; color: #1e40af;">
          Guarda este código para consultar o cancelar tu reserva
        </p>
      </div>
      ` : ''}

      <div class="alert alert-info">
        <strong>📌 Importante:</strong> Te enviaremos un recordatorio 24 horas antes de tu cita.
      </div>

      ${data.businessPhone ? `
      <p style="margin-top: 24px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `📧 ${data.businessEmail}<br>` : ''}
        📞 ${data.businessPhone}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>Gracias por confiar en ${data.businessName}</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
        Este es un correo automático, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Plantilla para notificación al dueño del negocio sobre nueva reserva
 */
export const businessNewBookingTemplate = (data: BookingEmailData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎉 Nueva Reserva Recibida</h1>
    </div>
    <div class="email-body">
      <h2>¡Tienes una nueva reserva!</h2>
      <p>Se ha registrado una nueva reserva en tu negocio <strong>${data.businessName}</strong>.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Cliente:</span>
          <span class="detail-value">${data.clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Servicio:</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        ${data.clientEmail ? `
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${data.clientEmail}</span>
        </div>
        ` : ''}
        ${data.clientPhone ? `
        <div class="detail-row">
          <span class="detail-label">Teléfono:</span>
          <span class="detail-value">${data.clientPhone}</span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <p style="margin-top: 24px;">
        Puedes gestionar esta reserva desde tu panel de administración.
      </p>
    </div>
    <div class="email-footer">
      <p>Sistema de Reservas - ${data.businessName}</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Plantilla para notificación de cancelación al cliente
 */
export const clientCancellationTemplate = (data: BookingEmailData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>❌ Reserva Cancelada</h1>
    </div>
    <div class="email-body">
      <h2>Hola ${data.clientName},</h2>
      <p>Te informamos que tu reserva ha sido <strong>cancelada</strong>.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Servicio:</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Negocio:</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
      </div>

      <div class="alert alert-warning">
        <strong>⚠️ Atención:</strong> Si tienes alguna pregunta sobre esta cancelación, por favor contacta directamente con el negocio.
      </div>

      ${data.businessPhone ? `
      <p style="margin-top: 24px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `📧 ${data.businessEmail}<br>` : ''}
        📞 ${data.businessPhone}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>${data.businessName}</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
        Este es un correo automático, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Plantilla para recordatorio de cita (24 horas antes)
 */
export const appointmentReminderTemplate = (data: BookingEmailData): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>⏰ Recordatorio de Cita</h1>
    </div>
    <div class="email-body">
      <h2>¡Hola ${data.clientName}! 👋</h2>
      <p>Te recordamos que tienes una cita programada para <strong>mañana</strong>.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Servicio:</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Negocio:</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <div class="alert alert-info">
        <strong>💡 Consejo:</strong> Te recomendamos llegar 10 minutos antes de tu cita.
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">Código de Acceso</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 12px; font-size: 14px; color: #1e40af;">
          Usa este código si necesitas consultar o cancelar tu reserva
        </p>
      </div>
      ` : ''}

      ${data.businessPhone ? `
      <p style="margin-top: 24px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `📧 ${data.businessEmail}<br>` : ''}
        📞 ${data.businessPhone}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>¡Nos vemos pronto en ${data.businessName}!</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
        Este es un correo automático, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
