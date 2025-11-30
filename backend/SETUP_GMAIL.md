# Configuración Rápida de Gmail para Notificaciones 🚀

## Pasos para Configurar Gmail (5 minutos)

### 1️⃣ Habilitar Verificación en 2 Pasos

1. Ve a: https://myaccount.google.com/security
2. En la sección **"Cómo accedes a Google"**, haz clic en **"Verificación en dos pasos"**
3. Sigue los pasos para activarla (si no está activa)

### 2️⃣ Crear Contraseña de Aplicación

1. Una vez habilitada la verificación en dos pasos, vuelve a: https://myaccount.google.com/security
2. Busca **"Contraseñas de aplicaciones"** (App Passwords)
3. Haz clic y selecciona:
   - **Aplicación**: Correo
   - **Dispositivo**: Otro (nombre personalizado)
   - Escribe: "BookPro Backend"
4. Haz clic en **Generar**
5. Copia la contraseña de 16 caracteres (aparece como: `xxxx xxxx xxxx xxxx`)

### 3️⃣ Configurar .env

Abre tu archivo `.env` en la carpeta `backend` y agrega:

```bash
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="tu-email@gmail.com"           # Tu email de Gmail
SMTP_PASS="xxxx xxxx xxxx xxxx"          # La contraseña de app (paso 2)
SMTP_FROM="BookPro <noreply@bookpro.com>"
```

**⚠️ IMPORTANTE:**
- Usa tu email completo de Gmail en `SMTP_USER`
- Usa la contraseña de aplicación (NO tu contraseña normal) en `SMTP_PASS`
- No quites los espacios de la contraseña

### 4️⃣ Reiniciar el Backend

```bash
cd backend
npm run dev
```

Deberías ver en la consola:
```
✅ Cron job de recordatorios iniciado
```

### 5️⃣ Probar el Sistema

Crea una reserva desde el frontend. Deberías ver en la consola:

```
📧 Email enviado: <mensaje-id>
```

Y recibir 2 emails:
- ✅ Confirmación al cliente
- ✅ Notificación al negocio

## Asegúrate de que el Negocio Tenga Email

Para que el dueño del negocio reciba notificaciones, verifica que tenga un email configurado en la base de datos:

```javascript
// En MongoDB, el negocio debe tener:
{
  "_id": "...",
  "name": "Mi Negocio",
  "email": "owner@example.com",  // ← Importante
  "phone": "+52 123 456 7890",
  ...
}
```

Puedes editar esto desde el panel de administración o directamente en MongoDB.

## Testing Rápido

### Via API (Postman/Insomnia)

```bash
POST http://localhost:3001/bookings
Content-Type: application/json

{
  "clientName": "Test User",
  "clientEmail": "test@example.com",
  "clientPhone": "+52 123 456 7890",
  "businessId": "TU_BUSINESS_ID",
  "serviceId": "TU_SERVICE_ID",
  "serviceName": "Servicio de Prueba",
  "scheduledAt": "2025-12-01T10:00:00Z"
}
```

### Via Frontend

1. Ve a la página de reservas
2. Completa el formulario con tu email
3. Envía la reserva
4. Revisa tu bandeja de entrada

## Troubleshooting

### ❌ "Invalid login" o "Authentication failed"

**Solución**: Asegúrate de usar la contraseña de aplicación, no tu contraseña normal de Gmail.

### ❌ No recibo emails

1. Verifica la consola del backend - debe mostrar `📧 Email enviado`
2. Revisa tu carpeta de spam
3. Verifica que `SMTP_USER` y `SMTP_PASS` estén correctos
4. Asegúrate de que el email del negocio esté en la base de datos

### ❌ "Connection timeout"

**Solución**: Intenta con puerto 465 y SMTP_SECURE=true:

```bash
SMTP_PORT=465
SMTP_SECURE=true
```

### ❌ Los recordatorios no se envían

1. Asegúrate de que hay reservas para mañana
2. Verifica que las reservas tengan `clientEmail`
3. Revisa que el cron job esté iniciado (log en consola)

## Alternativas a Gmail

Si prefieres no usar Gmail, consulta el archivo `README_EMAIL.md` para configurar:
- **Mailersend** (gratis, 12,000 emails/mes)
- **Resend** (gratis, 3,000 emails/mes)
- **SendGrid** (gratis, 100 emails/día)
- Cualquier servidor SMTP

## ¿Necesitas Ayuda?

Revisa la documentación completa en `README_EMAIL.md` para más detalles.
