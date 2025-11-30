/**
 * Clean HTML templates (shadcn-like) for transactional emails.
 * Keep text in plain ASCII to avoid encoding issues.
 */

const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #111827;
    background-color: #f9fafb;
  }
  .email-container {
    max-width: 640px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  }
  .email-header {
    background: linear-gradient(135deg, #111827 0%, #4338ca 100%);
    color: #ffffff;
    padding: 32px 28px;
    text-align: left;
  }
  .email-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .email-body {
    padding: 32px 28px;
  }
  .email-body h2 {
    margin: 0 0 12px 0;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }
  .email-body p {
    margin: 0 0 14px 0;
    color: #374151;
  }
  .booking-details {
    background-color: #f3f4f6;
    border-radius: 10px;
    padding: 18px;
    margin: 22px 0;
    border: 1px solid #e5e7eb;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 15px;
  }
  .detail-row:last-child {
    border-bottom: none;
  }
  .detail-label {
    font-weight: 600;
    color: #111827;
  }
  .detail-value {
    color: #4b5563;
    text-align: right;
  }
  .button {
    display: inline-block;
    padding: 12px 20px;
    background: linear-gradient(135deg, #4338ca 0%, #111827 100%);
    color: #ffffff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 16px 0;
  }
  .email-footer {
    background-color: #f9fafb;
    padding: 20px 28px;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
    border-top: 1px solid #e5e7eb;
  }
  .access-code {
    background-color: #eef2ff;
    border: 1px dashed #4338ca;
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    margin: 20px 0;
  }
  .access-code-label {
    font-size: 13px;
    color: #4338ca;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .access-code-value {
    font-size: 26px;
    font-weight: 800;
    color: #111827;
    letter-spacing: 4px;
    font-family: 'SFMono-Regular', 'Consolas', monospace;
  }
  .alert {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 12px 14px;
    margin: 20px 0;
    border-radius: 8px;
    color: #991b1b;
    font-weight: 600;
  }
  .alert-warning {
    background-color: #fffbeb;
    border-left-color: #f59e0b;
    color: #92400e;
  }
  .alert-info {
    background-color: #eff6ff;
    border-left-color: #3b82f6;
    color: #1e3a8a;
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
      <h1>Reserva confirmada</h1>
    </div>
    <div class="email-body">
      <h2>Hola ${data.clientName}!</h2>
      <p>Tu reserva se guardo correctamente. Aqui estan los detalles:</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y hora</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Negocio</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">Codigo de acceso</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 10px; font-size: 13px; color: #4338ca;">
          Guarda este codigo para consultar o cancelar tu reserva.
        </p>
      </div>
      ` : ''}

      <div class="alert alert-info">
        Te enviaremos un recordatorio 24 horas antes de tu cita.
      </div>

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 18px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>Gracias por reservar en ${data.businessName}</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 6px;">
        Este es un correo automatico, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

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
      <h1>Nueva reserva recibida</h1>
    </div>
    <div class="email-body">
      <h2>Tienes una nueva reserva</h2>
      <p>Se registro una nueva cita en <strong>${data.businessName}</strong>.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Cliente</span>
          <span class="detail-value">${data.clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y hora</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        ${data.clientEmail ? `
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${data.clientEmail}</span>
        </div>
        ` : ''}
        ${data.clientPhone ? `
        <div class="detail-row">
          <span class="detail-label">Telefono</span>
          <span class="detail-value">${data.clientPhone}</span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <p style="margin-top: 18px;">
        Gestiona la reserva desde tu panel de administracion.
      </p>
    </div>
    <div class="email-footer">
      <p>Sistema de reservas - ${data.businessName}</p>
    </div>
  </div>
</body>
</html>
  `;
};

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
      <h1>Reserva cancelada</h1>
    </div>
    <div class="email-body">
      <h2>Hola ${data.clientName},</h2>
      <p>Tu reserva fue cancelada.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y hora</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Negocio</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
      </div>

      <div class="alert alert-warning">
        Si tienes dudas sobre la cancelacion, contacta directamente con el negocio.
      </div>

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 18px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>${data.businessName}</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 6px;">
        Este es un correo automatico, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

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
      <h1>Recordatorio de cita</h1>
    </div>
    <div class="email-body">
      <h2>Hola ${data.clientName}!</h2>
      <p>Te recordamos que tienes una cita en 24 horas.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha y hora</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Negocio</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">Codigo de acceso</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 10px; font-size: 13px; color: #4338ca;">
          Usa este codigo si necesitas consultar o cancelar tu reserva.
        </p>
      </div>
      ` : ''}

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 18px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>Nos vemos pronto en ${data.businessName}</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 6px;">
        Este es un correo automatico, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
