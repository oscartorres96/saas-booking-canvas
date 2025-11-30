# Testing Manual de Emails 🧪

Este documento explica cómo probar los emails manualmente usando el controlador de testing.

## ⚠️ Importante

El controlador `TestEmailController` está diseñado **solo para desarrollo**. 
En producción, deberías:
- Comentar o eliminar este controlador
- O protegerlo con un guard especial

## Endpoints de Testing

Todos los endpoints requieren autenticación JWT (debes estar logueado).

### 1. Probar Email de Confirmación

```bash
POST http://localhost:3001/test-email/booking-confirmation
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "clientName": "Juan Pérez",
  "clientEmail": "tu-email@gmail.com",
  "clientPhone": "+52 123 456 7890",
  "serviceName": "Corte de Cabello",
  "scheduledAt": "2025-12-01T10:00:00Z",
  "businessId": "TU_BUSINESS_ID",
  "notes": "Primera vez"
}
```

**Resultado**: Se enviará un email de confirmación al `clientEmail` especificado.

### 2. Probar Email de Cancelación

```bash
POST http://localhost:3001/test-email/cancellation
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "clientName": "Juan Pérez",
  "clientEmail": "tu-email@gmail.com",
  "serviceName": "Corte de Cabello",
  "scheduledAt": "2025-12-01T10:00:00Z",
  "businessId": "TU_BUSINESS_ID"
}
```

**Resultado**: Se enviará un email de cancelación al `clientEmail` especificado.

### 3. Probar Email de Recordatorio

```bash
POST http://localhost:3001/test-email/reminder
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "clientName": "Juan Pérez",
  "clientEmail": "tu-email@gmail.com",
  "clientPhone": "+52 123 456 7890",
  "serviceName": "Corte de Cabello",
  "scheduledAt": "2025-12-01T10:00:00Z",
  "businessId": "TU_BUSINESS_ID",
  "notes": "Recuerda llegar 10 minutos antes"
}
```

**Resultado**: Se enviará un email de recordatorio al `clientEmail` especificado.

### 4. Ejecutar Cron Job Manualmente

```bash
POST http://localhost:3001/test-email/trigger-reminders
Authorization: Bearer YOUR_JWT_TOKEN
```

**Resultado**: Se ejecutará el cron job que busca citas en las próximas 24 horas y envía recordatorios.

## Ejemplos con cURL

### Obtener JWT Token (Login)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@bookpro.com",
    "password": "admin2025"
  }'
```

Guarda el `access_token` de la respuesta.

### Probar Confirmación

```bash
curl -X POST http://localhost:3001/test-email/booking-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "clientName": "Test User",
    "clientEmail": "test@example.com",
    "serviceName": "Prueba",
    "businessId": "64abc123..."
  }'
```

### Ejecutar Recordatorios

```bash
curl -X POST http://localhost:3001/test-email/trigger-reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Usando Postman/Insomnia

### 1. Login

**Request**:
- Method: `POST`
- URL: `http://localhost:3001/auth/login`
- Body (JSON):
```json
{
  "email": "owner@bookpro.com",
  "password": "admin2025"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

Copia el `access_token`.

### 2. Configurar Autorización

En Postman/Insomnia:
- Ve a la pestaña **Authorization** / **Auth**
- Type: **Bearer Token**
- Token: Pega el `access_token`

### 3. Probar Email de Confirmación

**Request**:
- Method: `POST`
- URL: `http://localhost:3001/test-email/booking-confirmation`
- Headers: (automático con Bearer Token)
- Body (JSON):
```json
{
  "clientEmail": "tu-email@gmail.com",
  "clientName": "Juan Pérez",
  "serviceName": "Corte de Cabello",
  "businessId": "674a6e43ca9e8bc4e5ee0c48"
}
```

## Valores por Defecto

Si no especificas algunos campos, se usarán valores por defecto:

```typescript
{
  clientName: 'Juan Pérez',
  clientEmail: 'test@example.com',
  clientPhone: '+52 123 456 7890',
  serviceName: 'Corte de Cabello',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
  accessCode: '123456',
  notes: 'Esta es una reserva de prueba'
}
```

## Verificar Logs

Cuando envías un email de prueba, revisa la consola del backend:

```bash
📧 Email enviado: <1234567890@smtp.gmail.com>
```

Si hay un error, verás:
```bash
❌ Error al enviar email: [detalles del error]
```

## Testing desde el Frontend

Si prefieres no usar Postman, puedes crear un botón temporal en tu frontend:

```typescript
// En cualquier componente con autenticación
const testEmail = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:3001/test-email/booking-confirmation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      clientEmail: 'tu-email@gmail.com',
      businessId: 'YOUR_BUSINESS_ID',
    }),
  });
  
  const result = await response.json();
  console.log(result);
};
```

## Troubleshooting

### ❌ 401 Unauthorized

**Causa**: Token JWT inválido o expirado.
**Solución**: Vuelve a hacer login y obtén un nuevo token.

### ❌ Email no se envía

**Causa**: Configuración SMTP incorrecta.
**Solución**: 
1. Verifica las variables en `.env`
2. Revisa los logs de la consola
3. Lee `SETUP_GMAIL.md` para configurar correctamente

### ❌ businessId no existe

**Causa**: El businessId especificado no existe en la base de datos.
**Solución**: 
1. Usa un businessId válido de tu base de datos
2. O deja el campo vacío para omitir la información del negocio

## Eliminar en Producción

Antes de poner tu app en producción, **elimina o comenta** el `TestEmailController`:

1. Borra el archivo: `src/services/test-email.controller.ts`
2. Quita la importación en `src/services/services.module.ts`
3. Quita el controlador del array de `controllers`

O simplemente comenta todo el archivo con `/* ... */`.

## Alternativa: Guard de Desarrollo

Si quieres mantener el controlador pero protegerlo, crea un guard especial:

```typescript
// dev.guard.ts
@Injectable()
export class DevGuard implements CanActivate {
  canActivate(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}

// Luego usa: @UseGuards(DevGuard)
```

Esto permitirá acceso solo en desarrollo.
