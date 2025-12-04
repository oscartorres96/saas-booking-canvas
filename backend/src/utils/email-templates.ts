/**
 * Clean HTML templates (shadcn-like) for transactional emails.
 * Keep text in plain ASCII to avoid encoding issues.
 */

const baseStyles = `
  :root {
    color-scheme: light dark;
    supported-color-schemes: light dark;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #111827;
    background-color: #f3f4f6;
    -webkit-font-smoothing: antialiased;
  }
  
  .email-container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .email-header {
    background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
    color: #ffffff;
    padding: 40px 32px;
    text-align: center;
  }
  
  .email-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.2;
  }
  
  .email-body {
    padding: 32px;
  }
  
  .email-body h2 {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    letter-spacing: -0.01em;
  }
  
  .email-body p {
    margin: 0 0 24px 0;
    color: #4b5563;
    font-size: 16px;
  }
  
  .booking-details {
    background-color: #f9fafb;
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    border: 1px solid #e5e7eb;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 15px;
  }
  
  .detail-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .detail-row:first-child {
    padding-top: 0;
  }
  
  .detail-label {
    font-weight: 500;
    color: #6b7280;
  }

  .detail-value {
    color: #111827;
    font-weight: 600;
    text-align: right;
  }

  .detail-notes {
    display: block;
  }

  .detail-notes .detail-label {
    display: block;
    margin-bottom: 6px;
  }

  .detail-notes .detail-value {
    display: block;
    text-align: left;
    white-space: pre-line;
    font-weight: 500;
  }
  
  .button {
    display: inline-block;
    padding: 14px 24px;
    background-color: #4338ca;
    color: #ffffff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 24px 0;
    text-align: center;
  }
  
  .email-footer {
    background-color: #f9fafb;
    padding: 32px;
    text-align: center;
    border-top: 1px solid #e5e7eb;
  }
  
  .email-footer p {
    margin: 4px 0;
    color: #6b7280;
    font-size: 13px;
  }
  
  .access-code {
    background-color: #eef2ff;
    border: 1px dashed #6366f1;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin: 32px 0;
  }
  
  .access-code-label {
    font-size: 14px;
    color: #4f46e5;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .access-code-value {
    font-size: 32px;
    font-weight: 700;
    color: #312e81;
    letter-spacing: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  
  .alert {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 16px;
    margin: 24px 0;
    border-radius: 6px;
    color: #991b1b;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .alert-warning {
    background-color: #fffbeb;
    border-left-color: #f59e0b;
    color: #92400e;
  }
  
  .alert-info {
    background-color: #eff6ff;
    border-left-color: #3b82f6;
    color: #1e40af;
  }

  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #111827 !important;
      color: #e5e7eb !important;
    }
    
    .email-container {
      background-color: #1f2937 !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
    }
    
    .email-header {
      background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%) !important;
    }
    
    .email-body h2 {
      color: #f3f4f6 !important;
    }
    
    .email-body p {
      color: #d1d5db !important;
    }
    
    .booking-details {
      background-color: #374151 !important;
      border-color: #4b5563 !important;
    }
    
    .detail-row {
      border-bottom-color: #4b5563 !important;
    }
    
    .detail-label {
      color: #9ca3af !important;
    }
    
    .detail-value {
      color: #f3f4f6 !important;
    }
    
    .email-footer {
      background-color: #111827 !important;
      border-top-color: #374151 !important;
    }
    
    .email-footer p {
      color: #9ca3af !important;
    }
    
    .access-code {
      background-color: #312e81 !important;
      border-color: #818cf8 !important;
    }
    
    .access-code-label {
      color: #c7d2fe !important;
    }
    
    .access-code-value {
      color: #ffffff !important;
    }
    
    .alert {
      background-color: #450a0a !important;
      border-left-color: #f87171 !important;
      color: #fca5a5 !important;
    }
    
    .alert-warning {
      background-color: #451a03 !important;
      border-left-color: #fbbf24 !important;
      color: #fcd34d !important;
    }
    
    .alert-info {
      background-color: #172554 !important;
      border-left-color: #60a5fa !important;
      color: #bfdbfe !important;
    }
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
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Reserva Confirmada</h1>
    </div>
    <div class="email-body">
      <h2>Hola ${data.clientName}!</h2>
      <p>Tu reserva se ha guardado correctamente. Aquí están los detalles:</p>
      
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
        <div class="detail-row detail-notes">
          <span class="detail-label">Notas</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">Código de acceso</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 12px; font-size: 14px; color: inherit; opacity: 0.8;">
          Guarda este código para consultar o cancelar tu reserva.
        </p>
        <p style="margin-top: 10px; font-size: 14px; color: inherit; opacity: 0.8;">
          Consulta tus citas en <a href="${process.env.PUBLIC_BOOKINGS_URL || ''}?email=${encodeURIComponent(data.clientEmail || '')}&code=${encodeURIComponent(data.accessCode || '')}" style="color: #4338ca; font-weight: 600; text-decoration: none;">Mis reservas</a> usando tu correo y código.
        </p>
      </div>
      ` : ''}

      <div class="alert alert-info">
        Te enviaremos un recordatorio 24 horas antes de tu cita.
      </div>

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>Gracias por reservar en ${data.businessName}</p>
      <p style="margin-top: 8px;">
        Este es un correo automático, por favor no responder.
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
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Nueva Reserva Recibida</h1>
    </div>
    <div class="email-body">
      <h2>Tienes una nueva reserva</h2>
      <p>Se registró una nueva cita en <strong>${data.businessName}</strong>.</p>
      
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
          <span class="detail-label">Teléfono</span>
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

      <p style="margin-top: 24px;">
        Gestiona la reserva desde tu panel de administración.
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
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Reserva Cancelada</h1>
    </div>
    <div class="email-body">
      <h2>Hola ${data.clientName},</h2>
      <p>Tu reserva ha sido cancelada.</p>
      
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
        Si tienes dudas sobre la cancelación, contacta directamente con el negocio.
      </div>

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>${data.businessName}</p>
      <p style="margin-top: 8px;">
        Este es un correo automático, por favor no responder.
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
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Recordatorio de Cita</h1>
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
        <div class="access-code-label">Código de acceso</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 12px; font-size: 14px; color: inherit; opacity: 0.8;">
          Usa este código si necesitas consultar o cancelar tu reserva.
        </p>
        <p style="margin-top: 10px; font-size: 14px; color: inherit; opacity: 0.8;">
          Consulta tus citas en <a href="${process.env.PUBLIC_BOOKINGS_URL || ''}?email=${encodeURIComponent(data.clientEmail || '')}&code=${encodeURIComponent(data.accessCode || '')}" style="color: #4338ca; font-weight: 600; text-decoration: none;">Mis reservas</a> usando tu correo y código.
        </p>
      </div>
      ` : ''}

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>Contacto del negocio:</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>Nos vemos pronto en ${data.businessName}</p>
      <p style="margin-top: 8px;">
        Este es un correo automático, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
