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
    display: block;
    padding: 16px 0;
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
    display: block;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 6px;
  }

  .detail-value {
    display: block;
    color: #111827;
    font-weight: 600;
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
  
  .email-logo {
    text-align: center;
    margin: 0 0 32px 0;
  }
  
  .email-logo img {
    max-width: 180px;
    height: auto;
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
  showReminder?: boolean;
  language?: string;
}

const translations = {
  es: {
    bookingConfirmed: "Reserva Confirmada",
    hello: "Hola",
    bookingSaved: "Tu reserva se ha guardado correctamente. Aquí están los detalles:",
    service: "Servicio",
    date: "Fecha y hora",
    business: "Negocio",
    notes: "Notas",
    accessCode: "Código de acceso",
    saveCode: "Guarda este código para consultar o cancelar tu reserva.",
    consultBookings: "Consulta tus citas en",
    myBookings: "Mis reservas",
    usingEmailCode: "usando tu correo y código.",
    reminderInfo: "Te enviaremos un recordatorio 24 horas antes de tu cita.",
    contactBusiness: "Contacto del negocio:",
    thanks: "Gracias por reservar en",
    autoEmail: "Este es un correo automático, por favor no responder.",
    newBooking: "Nueva Reserva Recibida",
    newBookingHeader: "Tienes una nueva reserva",
    newBookingBody: "Se registró una nueva cita en",
    client: "Cliente",
    email: "Email",
    phone: "Teléfono",
    manageBooking: "Gestiona la reserva desde tu panel de administración.",
    bookingSystem: "Sistema de reservas",
    bookingCancelled: "Reserva Cancelada",
    bookingCancelledBody: "Tu reserva ha sido cancelada.",
    cancellationDoubt: "Si tienes dudas sobre la cancelación, contacta directamente con el negocio.",
    reminderSubject: "Recordatorio de Cita",
    reminderBody: "Te recordamos que tienes una cita en 24 horas.",
    useCode: "Usa este código si necesitas consultar o cancelar tu reserva.",
    seeYouSoon: "Nos vemos pronto en",
    thanksVisit: "¡Gracias por tu visita!",
    hopeEnjoyed: "Esperamos que hayas disfrutado tu servicio en",
    markedCompleted: "Tu cita ha sido marcada como completada.",
    servicePerformed: "Servicio realizado",
    dateLabel: "Fecha",
    hopeSeeYou: "¡Esperamos verte pronto de nuevo!",
    bookAgain: "Reservar de nuevo",
    demoRequestSubject: "Solicitud de Demo",
    demoRequestHeader: "Nueva Solicitud de Demo",
    demoRequestBody: "Has recibido una nueva solicitud de demo.",
    name: "Nombre",
    company: "Empresa",
    message: "Mensaje",
    requestReceivedSubject: "Hemos recibido tu solicitud",
    requestReceivedHeader: "Solicitud Recibida",
    requestReceivedBody: "Hemos recibido tu solicitud de registro de negocio. Nuestro equipo revisará la información y te contactará pronto.",
    demoRequestReceivedBody: "Gracias por solicitar una demo. Nos pondremos en contacto contigo a la brevedad."
  },
  en: {
    bookingConfirmed: "Booking Confirmed",
    hello: "Hello",
    bookingSaved: "Your booking has been successfully saved. Here are the details:",
    service: "Service",
    date: "Date and time",
    business: "Business",
    notes: "Notes",
    accessCode: "Access Code",
    saveCode: "Keep this code to check or cancel your booking.",
    consultBookings: "Check your bookings at",
    myBookings: "My bookings",
    usingEmailCode: "using your email and code.",
    reminderInfo: "We will send you a reminder 24 hours before your appointment.",
    contactBusiness: "Business Contact:",
    thanks: "Thank you for booking at",
    autoEmail: "This is an automated email, please do not reply.",
    newBooking: "New Booking Received",
    newBookingHeader: "You have a new booking",
    newBookingBody: "A new appointment was registered at",
    client: "Client",
    email: "Email",
    phone: "Phone",
    manageBooking: "Manage the booking from your admin dashboard.",
    bookingSystem: "Booking system",
    bookingCancelled: "Booking Cancelled",
    bookingCancelledBody: "Your booking has been cancelled.",
    cancellationDoubt: "If you have questions about the cancellation, please contact the business directly.",
    reminderSubject: "Appointment Reminder",
    reminderBody: "This is a reminder that you have an appointment in 24 hours.",
    useCode: "Use this code if you need to check or cancel your booking.",
    seeYouSoon: "See you soon at",
    thanksVisit: "Thanks for your visit!",
    hopeEnjoyed: "We hope you enjoyed your service at",
    markedCompleted: "Your appointment has been marked as completed.",
    servicePerformed: "Service performed",
    dateLabel: "Date",
    hopeSeeYou: "We hope to see you again soon!",
    bookAgain: "Book again",
    demoRequestSubject: "Demo Request",
    demoRequestHeader: "New Demo Request",
    demoRequestBody: "You have received a new demo request.",
    name: "Name",
    company: "Company",
    message: "Message",
    requestReceivedSubject: "We received your request",
    requestReceivedHeader: "Request Received",
    requestReceivedBody: "We have received your business registration request. Our team will review the information and contact you soon.",
    demoRequestReceivedBody: "Thanks for requesting a demo. We will contact you soon."
  }
};

export interface DemoRequestData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  language?: string;
}

export const clientBookingConfirmationTemplate = (data: BookingEmailData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
      <h1>${t.bookingConfirmed}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello} ${data.clientName}!</h2>
      <p>${t.bookingSaved}</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.service}</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.date}</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.business}</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row detail-notes">
          <span class="detail-label">${t.notes}</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">${t.accessCode}</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 12px; font-size: 14px; color: inherit; opacity: 0.8;">
          ${t.saveCode}
        </p>
        <p style="margin-top: 10px; font-size: 14px; color: inherit; opacity: 0.8;">
          ${t.consultBookings} <a href="${process.env.PUBLIC_BOOKINGS_URL || ''}?email=${encodeURIComponent(data.clientEmail || '')}&code=${encodeURIComponent(data.accessCode || '')}" style="color: #4338ca; font-weight: 600; text-decoration: none;">${t.myBookings}</a> ${t.usingEmailCode}
        </p>
      </div>
      ` : ''}

      ${data.showReminder === false ? '' : `
      <div class="alert alert-info">
        ${t.reminderInfo}
      </div>
      `}

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>${t.contactBusiness}</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>${t.thanks} ${data.businessName}</p>
      <p style="margin-top: 8px;">
        ${t.autoEmail}
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

export const businessNewBookingTemplate = (data: BookingEmailData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
      <h1>${t.newBooking}</h1>
    </div>
    <div class="email-body">
      <h2>${t.newBookingHeader}</h2>
      <p>${t.newBookingBody} <strong>${data.businessName}</strong>.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.client}</span>
          <span class="detail-value">${data.clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.service}</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.date}</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        ${data.clientEmail ? `
        <div class="detail-row">
          <span class="detail-label">${t.email}</span>
          <span class="detail-value">${data.clientEmail}</span>
        </div>
        ` : ''}
        ${data.clientPhone ? `
        <div class="detail-row">
          <span class="detail-label">${t.phone}</span>
          <span class="detail-value">${data.clientPhone}</span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">${t.notes}</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <p style="margin-top: 24px;">
        ${t.manageBooking}
      </p>
    </div>
    <div class="email-footer">
      <p>${t.bookingSystem} - ${data.businessName}</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const clientCancellationTemplate = (data: BookingEmailData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
      <h1>${t.bookingCancelled}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello} ${data.clientName},</h2>
      <p>${t.bookingCancelledBody}</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.service}</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.date}</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.business}</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
      </div>

      <div class="alert alert-warning">
        ${t.cancellationDoubt}
      </div>

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>${t.contactBusiness}</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>${data.businessName}</p>
      <p style="margin-top: 8px;">
        ${t.autoEmail}
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

export const appointmentReminderTemplate = (data: BookingEmailData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
      <h1>${t.reminderSubject}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello} ${data.clientName}!</h2>
      <p>${t.reminderBody}</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.service}</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.date}</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.business}</span>
          <span class="detail-value">${data.businessName}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">${t.notes}</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.accessCode ? `
      <div class="access-code">
        <div class="access-code-label">${t.accessCode}</div>
        <div class="access-code-value">${data.accessCode}</div>
        <p style="margin-top: 12px; font-size: 14px; color: inherit; opacity: 0.8;">
          ${t.useCode}
        </p>
        <p style="margin-top: 10px; font-size: 14px; color: inherit; opacity: 0.8;">
          ${t.consultBookings} <a href="${process.env.PUBLIC_BOOKINGS_URL || ''}?email=${encodeURIComponent(data.clientEmail || '')}&code=${encodeURIComponent(data.accessCode || '')}" style="color: #4338ca; font-weight: 600; text-decoration: none;">${t.myBookings}</a> ${t.usingEmailCode}
        </p>
      </div>
      ` : ''}

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>${t.contactBusiness}</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>${t.seeYouSoon} ${data.businessName}</p>
      <p style="margin-top: 8px;">
        ${t.autoEmail}
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

interface WelcomeEmailData {
  ownerName: string;
  businessName: string;
  email: string;
  password?: string | null;
  loginUrl: string;
}

export const businessWelcomeTemplate = (data: WelcomeEmailData): string => {
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
      <h1>¡Bienvenido a BookPro!</h1>
    </div>
    <div class="email-body">
      <div class="email-logo">
        <svg width="180" height="60" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="40" height="40" rx="8" fill="url(#gradient)" />
          <path d="M20 25h20M20 30h20M20 35h15" stroke="white" stroke-width="2" stroke-linecap="round" />
          <text x="60" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700" fill="#1e1b4b">BookPro</text>
          <defs>
            <linearGradient id="gradient" x1="10" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
              <stop stop-color="#4338ca" />
              <stop offset="1" stop-color="#1e1b4b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h2>Hola ${data.ownerName},</h2>
      <p>Tu cuenta para administrar <strong>${data.businessName}</strong> ha sido creada exitosamente.</p>
      
      <p>A continuación te compartimos tus credenciales de acceso. Por favor, guárdalas en un lugar seguro.</p>

      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Portal de acceso</span>
          <span class="detail-value"><a href="${data.loginUrl}" style="color: #4338ca;">Iniciar Sesión</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Usuario / Email</span>
          <span class="detail-value">${data.email}</span>
        </div>
        ${data.password ? `
        <div class="detail-row">
          <span class="detail-label">Contraseña temporal</span>
          <span class="detail-value">${data.password}</span>
        </div>
        ` : ''}
      </div>

      <div class="alert alert-info">
        Te recomendamos cambiar tu contraseña una vez que ingreses al sistema.
      </div>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button" style="color: #ffffff;">Ir a mi panel</a>
      </div>

      <p style="font-size: 14px;">
        Si tienes problemas para acceder, no dudes en contactar al administrador del sistema.
      </p>
    </div>
    <div class="email-footer">
      <p>Bienvenido a la familia BookPro</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const clientBookingCompletedTemplate = (data: BookingEmailData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
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
      <h1>${t.thanksVisit}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello} ${data.clientName},</h2>
      <p>${t.hopeEnjoyed} <strong>${data.businessName}</strong>.</p>
      
      <p>${t.markedCompleted}</p>

      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.servicePerformed}</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.dateLabel}</span>
          <span class="detail-value">${data.scheduledAt}</span>
        </div>
      </div>

      <p style="margin-top: 24px;">
        ${t.hopeSeeYou}
      </p>

      ${(data.businessPhone || data.businessEmail) ? `
      <p style="margin-top: 24px; font-size: 14px;">
        <strong>${t.contactBusiness}</strong><br>
        ${data.businessEmail ? `${data.businessEmail}<br>` : ''}
        ${data.businessPhone ? `${data.businessPhone}` : ''}
      </p>
      ` : ''}

       <div style="text-align: center; margin-top: 32px;">
         <a href="${process.env.PUBLIC_BOOKINGS_URL || '#'}" class="button" style="color: #ffffff;">${t.bookAgain}</a>
      </div>
    </div>
    <div class="email-footer">
      <p>${data.businessName}</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const demoRequestTemplate = (data: DemoRequestData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${t.demoRequestHeader}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello}!</h2>
      <p>${t.demoRequestBody}</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.name}</span>
          <span class="detail-value">${data.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.email}</span>
          <span class="detail-value">${data.email}</span>
        </div>
        ${data.phone ? `
        <div class="detail-row">
          <span class="detail-label">${t.phone}</span>
          <span class="detail-value">${data.phone}</span>
        </div>
        ` : ''}
        ${data.company ? `
        <div class="detail-row">
          <span class="detail-label">${t.company}</span>
          <span class="detail-value">${data.company}</span>
        </div>
        ` : ''}
        ${data.message ? `
        <div class="detail-row">
          <span class="detail-label">${t.message}</span>
          <span class="detail-value">${data.message}</span>
        </div>
        ` : ''}
      </div>
    </div>
    <div class="email-footer">
      <p>BookPro Demo Request</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const businessRegistrationReceiptTemplate = (data: DemoRequestData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${t.requestReceivedHeader}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello} ${data.name}!</h2>
      <p>${t.requestReceivedBody}</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.name}</span>
          <span class="detail-value">${data.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.email}</span>
          <span class="detail-value">${data.email}</span>
        </div>
        ${data.phone ? `
        <div class="detail-row">
          <span class="detail-label">${t.phone}</span>
          <span class="detail-value">${data.phone}</span>
        </div>
        ` : ''}
        ${data.company ? `
        <div class="detail-row">
          <span class="detail-label">${t.company}</span>
          <span class="detail-value">${data.company}</span>
        </div>
        ` : ''}
      </div>

      <p style="margin-top: 24px;">
        ${t.autoEmail}
      </p>
    </div>
    <div class="email-footer">
      <p>BookPro Team</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const demoRequestReceiptTemplate = (data: DemoRequestData): string => {
  const lang = (data.language || 'es') as keyof typeof translations;
  const t = translations[lang];

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${t.requestReceivedHeader}</h1>
    </div>
    <div class="email-body">
      <h2>${t.hello} ${data.name}!</h2>
      <p>${t.demoRequestReceivedBody}</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">${t.name}</span>
          <span class="detail-value">${data.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.email}</span>
          <span class="detail-value">${data.email}</span>
        </div>
        ${data.phone ? `
        <div class="detail-row">
          <span class="detail-label">${t.phone}</span>
          <span class="detail-value">${data.phone}</span>
        </div>
        ` : ''}
        ${data.company ? `
        <div class="detail-row">
          <span class="detail-label">${t.company}</span>
          <span class="detail-value">${data.company}</span>
        </div>
        ` : ''}
        ${data.message ? `
        <div class="detail-row">
          <span class="detail-label">${t.message}</span>
          <span class="detail-value">${data.message}</span>
        </div>
        ` : ''}
      </div>

      <p style="margin-top: 24px;">
        ${t.autoEmail}
      </p>
    </div>
    <div class="email-footer">
      <p>BookPro Team</p>
    </div>
  </div>
</body>
</html>
  `;
};
