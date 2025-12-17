# Stripe Integration - BookPro

## Descripción

Esta implementación incluye un sistema completo de cobros con Stripe para BookPro, incluyendo:

- ✅ Sección de Pricing en el landing page (ES/EN)
- ✅ Creación de sesiones de Stripe Checkout
- ✅ Manejo de webhooks de Stripe
- ✅ Persistencia de suscripciones y pagos en MongoDB
- ✅ Páginas de éxito y cancelación de pago
- ✅ Internacionalización completa (ES/EN)

## Variables de Entorno

### Backend (`backend/.env`)

Agrega las siguientes variables de entorno a tu archivo `.env` del backend:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_1Seq4UQ12BYwu1GtvHcSAF4U

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

## Instalación

### 1. Instalar Dependencias

Las dependencias ya fueron instaladas, pero si necesitas reinstalarlas:

```bash
# Backend
cd backend
npm install stripe

# Frontend (no se necesitan paquetes adicionales de Stripe)
```

### 2. Configurar Stripe

1. **Crear/Iniciar sesión en cuenta de Stripe**: https://dashboard.stripe.com
2. **Modo Test**: Asegúrate de estar en modo "Test" (no "Live")
3. **Obtener API Keys**:
   - Ve a: Developers → API keys
   - Copia tu "Secret key" (comienza con `sk_test_`)
   - Pégala en `STRIPE_SECRET_KEY`

4. **Crear Producto y Precio**:
   - Ve a: Product catalog → Products
   - Crea un producto llamado "BookPro - Plan Mensual"
   - Precio: $299 MXN/mes (recurring)
   - Copia el Price ID (comienza con `price_`) y pégalo en `STRIPE_PRICE_ID`
   - **NOTA**: Ya incluimos un Price ID de prueba en el código, puedes usar el tuyo propio si prefieres

### 3. Configurar Webhooks

Los webhooks son **CRÍTICOS** - son la fuente de verdad para activar/desactivar suscripciones.

#### Opción A: Testing Local con Stripe CLI (Recomendado para desarrollo)

1. **Instalar Stripe CLI**: https://stripe.com/docs/stripe-cli#install

2. **Autenticar**:
   ```bash
   stripe login
   ```

3. **Escuchar webhooks** (en una terminal separada):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copiar webhook secret**:
   - El comando anterior mostrará algo como: `whsec_xxxxx`
   - Copia ese valor y pégalo en `STRIPE_WEBHOOK_SECRET`

5. **Probar webhook**:
   ```bash
   stripe trigger checkout.session.completed
   ```

#### Opción B: Webhook en Producción/Staging

1. Ve a: Developers → Webhooks → Add endpoint
2. URL del endpoint: `https://tu-dominio.com/api/stripe/webhook`
3. Selecciona estos eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copia el "Signing secret" y pégalo en `STRIPE_WEBHOOK_SECRET`

## Flujo de Uso

### Para el Cliente

1. Usuario visita la landing page
2. Ve la sección "Planes y Precios"
3. Hace clic en "Comenzar ahora" / "Get started"
4. Si no está autenticado, es redirigido a `/login`
5. Si está autenticado, es redirigido a Stripe Checkout
6. Completa el pago en Stripe
7. Es redirigido a `/payment/success` con confirmación
8. Auto-redireccionado al panel en 10 segundos

### Cancelación

- Si el usuario cancela en Stripe, es redirigido a `/payment/cancel`
- Desde ahí puede reintentar o volver al inicio

### Webhooks (Automatizado)

1. **checkout.session.completed**:
   - Crea registro de suscripción en BD
   - Actualiza `Business.subscriptionStatus` a `'active'`
   - Crea registro de pago

2. **invoice.payment_succeeded**:
   - Actualiza estado de suscripción a `'active'`
   - Actualiza fechas de período
   - Crea registro de pago

3. **invoice.payment_failed**:
   - Marca suscripción como `'past_due'`
   - Degrada negocio a `'trial'` (modo gracia)
   - Crea registro de pago fallido

4. **customer.subscription.deleted**:
   - Marca suscripción como `'canceled'`
   - Cambia `Business.subscriptionStatus` a `'inactive'`

## Testing

### Tarjetas de Prueba

Stripe proporciona tarjetas de prueba: https://stripe.com/docs/testing

- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Falla**: `4000 0000 0000 9995`

Usa cualquier fecha futura como expiración, cualquier CVC de 3 dígitos, y cualquier código postal.

### Probar el Flujo Completo

1. **Iniciar los servidores**:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev

   # Stripe Webhooks (terminal separada)
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Crear un usuario/negocio** (si no tienes uno):
   - Registrarse vía `/login`
   - Completar onboarding

3. **Ir al landing** y hacer clic en "Comenzar ahora"

4. **Completar checkout** con tarjeta de prueba

5. **Verificar**:
   - Webhook recibido en la terminal de Stripe CLI
   - Registro creado en MongoDB (`subscriptions` collection)
   - Business status actualizado a `'active'`
   - Redirección a success page

## Estructura de BD

### Collection: `subscriptions`

```javascript
{
  _id: ObjectId,
  userId: String,
  businessId: String,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  priceId: String,
  status: 'active' | 'past_due' | 'canceled' | ...,
  currentPeriodEnd: Date,
  currentPeriodStart: Date,
  canceledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `payments`

```javascript
{
  _id: ObjectId,
  stripeSessionId: String,
  stripeInvoiceId: String,
  stripePaymentIntentId: String,
  businessId: String,
  userId: String,
  amount: Number, // centavos
  currency: String, // 'mxn'
  status: 'paid' | 'failed' | 'pending' | 'refunded',
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints

### POST `/api/stripe/checkout/subscription`

**Auth**: Required (JWT)

```json
{
  "userId": "string",
  "businessId": "string",
  "successUrl": "string (optional)",
  "cancelUrl": "string (optional)",
  "priceId": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### POST `/api/stripe/webhook`

**Auth**: None (signature verification via Stripe)

Este endpoint recibe eventos de Stripe y NO debe tener autenticación JWT.

### GET `/api/stripe/subscription/:businessId`

**Auth**: Required

Obtiene la suscripción activa de un negocio.

### GET `/api/stripe/payments/:businessId`

**Auth**: Required

Obtiene el historial de pagos de un negocio.

## Seguridad

- ✅ Verificación de firma de webhooks con `STRIPE_WEBHOOK_SECRET`
- ✅ Raw body habilitado en NestJS para validar firmas
- ✅ Endpoints protegidos con JWT (excepto webhook)
- ✅ Metadata en sesiones para validar userId/businessId

## Troubleshooting

### Error: "Webhook signature verification failed"

- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- Asegúrate de que el backend esté configurado con `rawBody: true`
- Revisa que la URL del webhook coincida exactamente

### Error: "No checkout URL received"

- Verifica `STRIPE_SECRET_KEY`
- Asegúrate de estar en modo test
- Revisa que el `priceId` sea válido

### Subscription no se activa después del pago

- Verifica que el webhook esté configurado y funcionando
- Revisa los logs del backend para ver si el evento llegó
- Verifica que `STRIPE_WEBHOOK_SECRET` sea el correcto

### Frontend no redirige

- Verifica `FRONTEND_URL` en el backend
- Asegúrate de que las rutas `/payment/success` y `/payment/cancel` existan

## Production Checklist

Antes de ir a producción:

- [ ] Cambiar a claves LIVE de Stripe (no test)
- [ ] Configurar webhook en producción (no Stripe CLI)
- [ ] Actualizar `FRONTEND_URL` y `BACKEND_URL` a dominios reales
- [ ] Probar flujo completo en staging
- [ ] Configurar manejo de errores y logging apropiado
- [ ] Revisar que CORS permita el dominio de producción
- [ ] Implementar rate limiting en endpoints públicos (webhook)

## Soporte

Para más información sobre Stripe:
- Docs: https://stripe.com/docs
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks

¡Listo para recibir pagos! 🎉
