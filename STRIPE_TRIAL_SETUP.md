# 🎯 Configuración del Paquete de Prueba ($1 MXN) en Stripe

## 📋 Problema Identificado

El código está intentando usar `STRIPE_PRICE_ID_TRIAL` que actualmente no existe en tu cuenta de Stripe. Cuando un usuario hace clic en "Comenzar ahora" en el paquete de prueba, el sistema falla porque necesita un **Price ID real** de Stripe.

## ✅ Solución: Crear el Precio de Prueba

### Paso 1: Ir a Stripe Dashboard

1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **IMPORTANTE**: Asegúrate de estar en **modo LIVE** (no test) si ya estás en producción
3. En el menú lateral, ve a **Products** → **Add Product**

### Paso 2: Crear el Producto

**Configuración del Producto:**
- **Name**: `BookPro - Paquete de Prueba` o `BookPro - Trial Package`
- **Description**: `Acceso completo por 7 días - Período de prueba`
- **Pricing Model**: `Standard pricing`

### Paso 3: Configurar el Precio

**Configuración del Precio:**
- **Price**: `1` (un peso)
- **Currency**: `MXN` (pesos mexicanos)
- **Billing period**: `One time` ⚠️ **IMPORTANTE**

> **Nota**: El paquete de prueba es un **pago único de $1 MXN**, NO es una suscripción recurrente.

### Paso 4: Copiar el Price ID

Una vez creado, verás un **Price ID** que empieza con `price_...`

Ejemplo: `price_1SgXYZQ12BYwu1Gtabcd1234`

**Copia este ID** - lo necesitarás para el siguiente paso.

## 🔧 Configurar Variables de Entorno

### En Producción (Railway/Render/etc.)

Agrega esta variable de entorno a tu servidor de producción:

```env
STRIPE_PRICE_ID_TRIAL=price_TU_PRICE_ID_AQUI
```

Reemplaza `price_TU_PRICE_ID_AQUI` con el Price ID real que copiaste de Stripe.

### Variables Completas Requeridas

Tu backend en producción debe tener estas 4 variables:

```env
# Claves de Stripe
STRIPE_SECRET_KEY=sk_live_...  # Tu clave secreta LIVE
STRIPE_WEBHOOK_SECRET=whsec_...  # Tu webhook secret

# Price IDs
STRIPE_PRICE_ID_MONTHLY=price_1Seq4UQ12BYwu1GtvHcSAF4U  # $299 MXN/mes
STRIPE_PRICE_ID_ANNUAL=price_1Sf5dUQ12BYwu1Gtc44DvB2d   # $3,289 MXN/año
STRIPE_PRICE_ID_TRIAL=price_TU_TRIAL_PRICE_ID_AQUI      # $1 MXN único
```

## ⚠️ Alternativa: Cambiar el Modelo del Trial

**Opción A: Pago Único (Actual)**
- Precio: $1 MXN
- Tipo: One-time payment
- Usuario paga $1 y tiene acceso por 7 días
- Después debe suscribirse al plan regular

**Opción B: Suscripción con Trial**
- Precio: $299 MXN/mes
- Trial period: 7 días gratis
- Usuario no paga nada al inicio
- Después de 7 días, se cobra automáticamente
- Ventaja: Conversión más alta
- Desventaja: Necesita tarjeta de crédito desde el inicio

### Si eliges Opción B (Recomendado):

En Stripe:
1. Crea un precio de **$299 MXN/mes** (o usa el existente)
2. En la configuración del precio, activa: **Add a free trial**
3. Duración del trial: **7 days**
4. Copia el Price ID

Luego actualiza el código en `stripe.service.ts`:

```typescript
// Línea 69-71 y 145-148
} else if (billingPeriod === 'trial') {
    // Usar el mismo precio mensual pero Stripe aplicará el trial automáticamente
    finalPriceId = this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U';
} else {
```

**Con este cambio:**
- ✅ No necesitas `STRIPE_PRICE_ID_TRIAL`
- ✅ El trial lo maneja Stripe automáticamente
- ✅ Mayor tasa de conversión (no hay fricción de pago)

## 🚀 Verificación

Después de configurar, verifica:

1. **Variables configuradas** en producción
2. **Servidor reiniciado** para tomar las nuevas variables
3. **Probar el flujo completo**:
   - Ir a la landing page
   - Click en "Probar ahora" del paquete de prueba
   - Llenar el formulario
   - Verificar que redirige a Stripe correctamente
   - Confirmar que el precio mostrado es $1 MXN (o trial gratis si usas Opción B)

## 📊 Resumen de Price IDs

| Plan | Precio | Tipo | Price ID Variable |
|------|--------|------|-------------------|
| **Trial** | $1 MXN | One-time | `STRIPE_PRICE_ID_TRIAL` |
| **Mensual** | $299 MXN | Subscription | `STRIPE_PRICE_ID_MONTHLY` |
| **Anual** | $3,289 MXN | Subscription | `STRIPE_PRICE_ID_ANNUAL` |

## 🔍 Debug en Caso de Error

Si sigues viendo errores, revisa los logs del backend:

```bash
# En Railway/Render, revisa los logs y busca:
[StripeService] Using trial price ID: price_xxx
```

Si ves `price_trial_placeholder`, significa que la variable de entorno NO está configurada.

## ✨ Mi Recomendación

**Usa la Opción B (Suscripción con trial de 7 días gratis)**

Razones:
1. ✅ Menos fricción - solo piden email/nombre
2. ✅ Mayor conversión - no necesitan pagar $1
3. ✅ Más profesional - estándar de la industria
4. ✅ Stripe guarda la tarjeta - cobra automáticamente después
5. ✅ Menos código - no necesitas crear precio separado

¿Quieres que implemente la Opción B?
