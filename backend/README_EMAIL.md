# Sistema de Notificaciones por Email 📧

Este documento explica cómo configurar y usar el sistema de notificaciones por email en BookPro.

## Características

✅ **Confirmación de Reserva**: Envía correos al cliente y al dueño del negocio cuando se crea una reserva.  
✅ **Cancelación de Cita**: Notifica al cliente cuando se cancela una reserva.  
✅ **Recordatorios Automáticos**: Envía recordatorios 24 horas antes de cada cita (cron job).  
✅ **Plantillas HTML Modernas**: Diseño limpio y profesional inspirado en shadcn/ui.  
✅ **Múltiples Proveedores SMTP**: Compatible con Gmail, Mailersend, Resend, y otros.

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="BookPro <noreply@bookpro.com>"
```

### 2. Configuración por Proveedor

#### Gmail

Para usar Gmail necesitas crear una **contraseña de aplicación**:

1. Ve a tu [cuenta de Google](https://myaccount.google.com/)
2. Navega a **Seguridad** → **Verificación en dos pasos** (actívala si no está activa)
3. Ve a **Contraseñas de aplicaciones**
4. Genera una contraseña para "Correo" en "Otra app personalizada"
5. Usa esta contraseña en `SMTP_PASS`

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"  # Contraseña de aplicación (16 caracteres)
```

#### Mailersend

1. Crea una cuenta en [Mailersend](https://www.mailersend.com/)
2. Verifica tu dominio
3. Crea un API token o credenciales SMTP
4. Configura:

```bash
SMTP_HOST="smtp.mailersend.net"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="MS_xxxxxx@trial-xxxxx.mlsender.net"
SMTP_PASS="tu-api-token"
```

#### Resend

1. Crea una cuenta en [Resend](https://resend.com/)
2. Verifica tu dominio
3. Crea una API key
4. Configura:

```bash
SMTP_HOST="smtp.resend.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="resend"
SMTP_PASS="re_xxxxxxxxxxxx"  # Tu API key
```

## Estructura de Archivos

```
backend/src/
├── utils/
│   ├── email.ts              # Función sendEmail y configuración de transporte
│   └── email-templates.ts    # Plantillas HTML para los correos
├── services/
│   ├── notification.service.ts  # Lógica de negocio para notificaciones
│   ├── cron.service.ts         # Cron job para recordatorios
│   └── services.module.ts      # Módulo que exporta los servicios
└── bookings/
    ├── bookings.service.ts     # Integración de notificaciones
    └── bookings.module.ts      # Importa ServicesModule
```

## Uso

### Enviar Notificación Manual

```typescript
import { NotificationService } from './services/notification.service';

// En tu servicio
async createBooking(data) {
  const booking = await this.bookingModel.save(data);
  
  // Envía confirmación
  await this.notificationService.sendBookingConfirmation(booking);
  
  return booking;
}
```

### Enviar Recordatorio Manual

```typescript
import { CronService } from './services/cron.service';

// Para testing
await this.cronService.triggerRemindersManually();
```

## Tipos de Emails

### 1. Confirmación de Reserva (Cliente)

**Trigger**: Cuando se crea una nueva reserva  
**Destinatario**: Email del cliente  
**Contenido**:
- Detalles de la reserva (servicio, fecha, hora)
- Código de acceso para consultas/cancelaciones
- Información de contacto del negocio
- Recordatorio de que recibirá una notificación 24h antes

### 2. Notificación de Nueva Reserva (Negocio)

**Trigger**: Cuando se crea una nueva reserva  
**Destinatario**: Email del dueño del negocio  
**Contenido**:
- Información del cliente
- Detalles de la reserva
- Notas adicionales

### 3. Cancelación de Reserva (Cliente)

**Trigger**: Cuando se cancela una reserva  
**Destinatario**: Email del cliente  
**Contenido**:
- Detalles de la reserva cancelada
- Información de contacto del negocio por si tiene dudas

### 4. Recordatorio de Cita (Cliente)

**Trigger**: 24 horas antes de la cita (automático)  
**Destinatario**: Email del cliente  
**Contenido**:
- Detalles de la cita de mañana
- Código de acceso
- Consejo de llegar 10 minutos antes
- Información de contacto del negocio

## Cron Job de Recordatorios

El cron job se ejecuta automáticamente cada hora y busca citas que sean en 24 horas.

### Configuración

En `cron.service.ts`:

```typescript
// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  await this.sendUpcomingReminders();
});

// Para testing: ejecutar cada minuto
cron.schedule('* * * * *', async () => {
  await this.sendUpcomingReminders();
});
```

### Desactivar Recordatorios

Si no tienes configuradas las variables de SMTP, el cron job se desactivará automáticamente con un warning en la consola.

## Testing

### 1. Verificar Configuración

```bash
# Asegúrate de que las variables están en .env
cat .env | grep SMTP
```

### 2. Probar Envío de Email

Crea una reserva desde el frontend o via API:

```bash
POST http://localhost:3001/bookings
{
  "clientName": "Juan Pérez",
  "clientEmail": "juan@example.com",
  "clientPhone": "+52 123 456 7890",
  "businessId": "64abc123...",
  "serviceId": "64xyz789...",
  "serviceName": "Corte de cabello",
  "scheduledAt": "2025-12-01T10:00:00Z",
  "notes": "Primera vez"
}
```

Deberías recibir:
- ✅ Email de confirmación al cliente
- ✅ Email de nueva reserva al negocio
- ✅ Logs en consola del backend

### 3. Probar Cancelación

```bash
POST http://localhost:3001/bookings/cancel-public
{
  "bookingId": "64booking...",
  "clientEmail": "juan@example.com",
  "accessCode": "123456"
}
```

Deberías recibir:
- ✅ Email de cancelación al cliente
- ✅ Logs en consola del backend

### 4. Probar Recordatorios Manualmente

Modifica temporalmente el rango de búsqueda en `cron.service.ts` o ejecuta:

```typescript
// En tu controlador o a través de un endpoint de testing
await cronService.triggerRemindersManually();
```

## Troubleshooting

### ❌ Emails no se envían

1. Verifica que las variables de entorno están correctamente configuradas
2. Revisa los logs de la consola para ver errores
3. Asegúrate de que el email del negocio está guardado en la base de datos
4. Verifica que el proveedor SMTP está funcionando

### ❌ Gmail rechaza la conexión

- Asegúrate de usar una **contraseña de aplicación**, no tu contraseña normal
- Verifica que la verificación en dos pasos esté activa
- Intenta con `SMTP_SECURE=true` y `SMTP_PORT=465`

### ❌ Los recordatorios no se envían

- Verifica que el cron job esté iniciado (busca el log: "✅ Cron job de recordatorios iniciado")
- Revisa que haya reservas en las próximas 24 horas
- Asegúrate de que las reservas tienen `clientEmail`
- Verifica que las reservas no estén canceladas

## Personalizar Plantillas

Las plantillas HTML están en `/backend/src/utils/email-templates.ts`.

Puedes modificar:
- Colores del gradiente
- Textos y mensajes
- Estructura del HTML
- Estilos CSS inline

Ejemplo de cambiar el color del header:

```typescript
.email-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);  // Cambiar aquí
  color: #ffffff;
  padding: 32px 24px;
  text-align: center;
}
```

## Mejoras Futuras

- [ ] Soporte para adjuntos (PDFs de confirmación)
- [ ] Plantillas editables desde el panel de administración
- [ ] Múltiples idiomas
- [ ] Estadísticas de apertura de emails
- [ ] Webhooks para eventos de email (entregado, abierto, rebotado)
- [ ] Cola de emails con Bull/Redis para mejor performance

## Recursos

- [Nodemailer Docs](https://nodemailer.com/about/)
- [Node-cron Docs](https://www.npmjs.com/package/node-cron)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Mailersend Docs](https://www.mailersend.com/help)
- [Resend Docs](https://resend.com/docs)
