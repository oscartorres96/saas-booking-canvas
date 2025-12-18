# 🚀 Configuración de Stripe en Modo LIVE (Producción)

## ✅ Confirmación de Activación

¡Felicidades! Has activado tu cuenta de Stripe en modo LIVE. Ahora necesitamos actualizar tu aplicación BookPro para usar las claves de producción.

## 📋 Checklist de Migración a Producción

### 1. Obtener las Claves de API de Producción

1. **Accede a tu Dashboard de Stripe**: https://dashboard.stripe.com
2. **Asegúrate de estar en modo "LIVE"** (esquina superior derecha debe decir "Live mode")
3. **Ve a Developers → API keys**
4. Copia las siguientes claves:
   - **Secret key** (comienza con `sk_live_...`)
   - **Publishable key** (comienza con `pk_live_...`) - *solo si la necesitas en el frontend*

### 2. Obtener los Price IDs de Producción

Necesitas crear tus productos/precios en modo LIVE:

#### Paso 2.1: Crear el Plan Mensual

1. Ve a **Product catalog → Products** (en modo LIVE)
2. Clic en **"+ Add product"**
3. Configura:
   - **Name**: `BookPro - Plan Mensual`
   - **Description**: `Suscripción mensual a BookPro`
   - **Price**: `$349.00 MXN`
   - **Billing period**: `Monthly`
   - **Recurring**: ✅ Activado
4. Clic en **"Save product"**
5. **Copia el Price ID** (comienza con `price_...`)
   - Ejemplo: `price_1ABC123...`

#### Paso 2.2: Crear el Plan Anual

1. En la misma página de productos, clic en **"+ Add product"**
2. Configura:
   - **Name**: `BookPro - Plan Anual`
   - **Description**: `Suscripción anual a BookPro (Ahorra 2 meses)`
   - **Price**: `$3,490.00 MXN`
   - **Billing period**: `Yearly`
   - **Recurring**: ✅ Activado
3. Clic en **"Save product"**
4. **Copia el Price ID** (comienza con `price_...`)

### 3. Configurar el Webhook de Producción

Los webhooks son **CRÍTICOS** para la activación automática de suscripciones.

1. Ve a **Developers → Webhooks** (en modo LIVE)
2. Clic en **"+ Add endpoint"**
3. Configura:
   - **Endpoint URL**: `https://TU-DOMINIO.com/api/stripe/webhook`
     - Reemplaza `TU-DOMINIO.com` con tu dominio real de producción
   - **Description**: `BookPro Production Webhook`
   - **Events to send**: Selecciona los siguientes eventos:
     - ✅ `checkout.session.completed`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.deleted`
     - ✅ `customer.subscription.updated`
4. Clic en **"Add endpoint"**
5. **Copia el Signing secret** (comienza con `whsec_...`)

### 4. Actualizar Variables de Entorno del Backend

Necesitas actualizar tu archivo `.env` del backend con las claves de producción.

⚠️ **IMPORTANTE**: Nunca subas estas claves a GitHub o repositorios públicos.

```env
# ============================================
# STRIPE LIVE MODE CONFIGURATION
# ============================================
# ⚠️ ESTAS SON CLAVES DE PRODUCCIÓN - MANTENER SEGURAS

# Clave secreta de Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_AQUI

# Webhook secret (LIVE)
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI

# Price IDs (LIVE)
STRIPE_PRICE_ID_MONTHLY=price_TU_PRICE_ID_MENSUAL_AQUI
STRIPE_PRICE_ID_ANNUAL=price_TU_PRICE_ID_ANUAL_AQUI

# Retrocompatibilidad (usa el mismo que MONTHLY)
STRIPE_PRICE_ID=price_TU_PRICE_ID_MENSUAL_AQUI

# URLs de producción
FRONTEND_URL=https://TU-DOMINIO-FRONTEND.com
BACKEND_URL=https://TU-DOMINIO-BACKEND.com
```

### 5. Reiniciar el Servidor Backend

Después de actualizar las variables de entorno:

```bash
# Si estás usando PM2
pm2 restart bookpro-backend

# Si estás corriendo manualmente
npm run build
npm run start:prod
```

### 6. Verificar la Configuración

#### Test de Conexión

Puedes verificar que las claves funcionan haciendo una prueba de pago:

1. **Usa una tarjeta REAL** (en modo LIVE no puedes usar tarjetas de prueba)
2. Completa un pago de prueba
3. Verifica en el Dashboard de Stripe que el pago aparece
4. Cancela la suscripción inmediatamente si es solo una prueba

#### Webhooks

Verifica que los webhooks están funcionando:

1. Ve a **Developers → Webhooks** en Stripe
2. Haz clic en tu webhook
3. Ve a la pestaña **"Testing"**
4. Envía un evento de prueba `checkout.session.completed`
5. Revisa los logs de tu backend para confirmar que el evento fue recibido

### 7. Diferencias entre TEST y LIVE

| Aspecto | Modo TEST | Modo LIVE |
|---------|-----------|-----------|
| Claves API | `sk_test_...` | `sk_live_...` |
| Tarjetas | Tarjetas de prueba | Tarjetas reales |
| Webhooks | Stripe CLI local | Endpoint HTTPS público |
| Cobros reales | ❌ No | ✅ Sí |
| Dashboard | Datos de prueba | Datos reales |

## 🔒 Seguridad en Producción

### Variables de Entorno

- ✅ **Nunca** hardcodees las claves en el código
- ✅ Usa un servicio de gestión de secretos (AWS Secrets Manager, etc.)
- ✅ Mantén las claves en archivos `.env` que **NO** están en Git
- ✅ Usa diferentes claves para diferentes entornos (staging, production)

### Webhook Security

- ✅ El endpoint de webhook verifica automáticamente la firma de Stripe
- ✅ Solo procesa eventos con firmas válidas
- ✅ Implementa rate limiting en producción

### Logging

- ✅ Mantén logs de todos los eventos de Stripe
- ✅ Monitorea pagos fallidos
- ✅ Configura alertas para eventos críticos

## 📊 Monitoreo Post-Lanzamiento

### Cosas para vigilar:

1. **Pagos exitosos vs fallidos**
   - Dashboard de Stripe → Payments
2. **Webhooks recibidos**
   - Developers → Webhooks → Ver logs
3. **Suscripciones activas**
   - Customers → Subscriptions
4. **Disputas/Chargebacks**
   - Payments → Disputes

## 🚨 Troubleshooting Común

### Error: "No such price"
- **Causa**: Estás usando un Price ID de test en modo LIVE (o viceversa)
- **Solución**: Verifica que los Price IDs en `.env` sean de LIVE mode

### Webhook no funciona
- **Causa**: URL incorrecta o secret incorrecto
- **Solución**: 
  1. Verifica que la URL sea accesible públicamente (HTTPS)
  2. Verifica que `STRIPE_WEBHOOK_SECRET` sea el correcto
  3. Revisa los logs del webhook en Stripe Dashboard

### Suscripción no se activa
- **Causa**: Webhook no está llegando o hay error en procesamiento
- **Solución**:
  1. Verifica logs del backend
  2. Revisa que el evento llegó a Stripe (Dashboard → Webhooks → Logs)
  3. Verifica que MongoDB está conectado

## ✅ Checklist Final

Antes de ir completamente a producción:

- [ ] Claves de API LIVE configuradas
- [ ] Price IDs de LIVE creados y configurados
- [ ] Webhook de producción configurado y probado
- [ ] Variables de entorno actualizadas en servidor de producción
- [ ] Backend reiniciado con nuevas variables
- [ ] Pago de prueba completado exitosamente
- [ ] Webhook recibido y procesado correctamente
- [ ] Suscripción activada en BD
- [ ] Página de éxito funciona correctamente
- [ ] Monitoreo configurado
- [ ] Backups de BD configurados

## 📞 Soporte Stripe

Si tienes problemas:
- **Docs**: https://stripe.com/docs
- **Support**: https://support.stripe.com
- **Status**: https://status.stripe.com

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación BookPro estará lista para:
- ✅ Recibir pagos reales
- ✅ Activar suscripciones automáticamente
- ✅ Procesar renovaciones mensuales/anuales
- ✅ Manejar cancelaciones y reembolsos

**¡Felicidades por lanzar tu negocio! 🚀**
