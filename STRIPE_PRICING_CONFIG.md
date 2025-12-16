# Configuración de Stripe para Planes Mensuales y Anuales

## 📋 Variables de Entorno Requeridas

Agrega estas variables a tu archivo `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Tu clave secreta de Stripe (ya configurada)
STRIPE_WEBHOOK_SECRET=whsec_...  # Tu webhook secret (ya configurada)

# Price IDs para diferentes planes
STRIPE_PRICE_ID_MONTHLY=price_1Seq4UQ12BYwu1GtvHcSAF4U  # Plan mensual ($299 MXN/mes)
STRIPE_PRICE_ID_ANNUAL=price_1Sf5dUQ12BYwu1Gtc44DvB2d   # Plan anual ($3,289 MXN/año)

# Retrocompatibilidad (opcional, se usa STRIPE_PRICE_ID_MONTHLY por defecto)
STRIPE_PRICE_ID=price_1Seq4UQ12BYwu1GtvHcSAF4U
```

## 🎯 Cómo Funciona

1. **Frontend (PricingSection)**: 
   - El usuario selecciona entre "Mensual" o "Anual"
   - El estado `isAnnual` determina qué plan mostrar
   - Al hacer clic en "Comenzar ahora", se pasa `billingPeriod` al `DirectPurchaseDialog`

2. **Frontend (DirectPurchaseDialog)**:
   - Recibe `billingPeriod` como prop
   - Envía este valor al backend en la petición POST

3. **Backend (StripeService)**:
   - Recibe `billingPeriod` en el DTO
   - Selecciona el Price ID correcto:
     - Si `billingPeriod === 'annual'` → usa `STRIPE_PRICE_ID_ANNUAL`
     - Si `billingPeriod === 'monthly'` → usa `STRIPE_PRICE_ID_MONTHLY`
   - Crea la sesión de Stripe Checkout con el precio correcto

## 💰 Configuración de Precios en Stripe

### Plan Mensual
- **Precio**: $299 MXN
- **Frecuencia**: Mensual
- **Price ID actual**: `price_1Seq4UQ12BYwu1GtvHcSAF4U`

### Plan Anual
- **Precio**: $3,289 MXN (equivalente a 11 meses)
- **Frecuencia**: Anual
- **Price ID**: `price_1Sf5dUQ12BYwu1Gtc44DvB2d`
- **Ahorro**: $299 MXN (1 mes gratis)

## ✅ Pasos para Probar

1. **Agregar las variables al `.env`** del backend
2. **Reiniciar el servidor backend** para que tome las nuevas variables
3. **Ir a la landing page** y navegar a la sección de precios
4. **Probar el toggle** entre Mensual y Anual
5. **Hacer clic en "Comenzar ahora"** y verificar que:
   - El formulario se abre correctamente
   - Al enviar, redirige a Stripe Checkout
   - El precio en Stripe coincide con el plan seleccionado

## 🔍 Debugging

Si necesitas verificar qué Price ID se está usando, revisa los logs del backend:
```
[StripeService] Using annual price ID: price_1Sf5dUQ12BYwu1Gtc44DvB2d
[StripeService] Direct purchase checkout created for lead: 65xxx with annual billing
```

O para plan mensual:
```
[StripeService] Using monthly price ID: price_1Seq4UQ12BYwu1GtvHcSAF4U
[StripeService] Direct purchase checkout created for lead: 65xxx with monthly billing
```

## 🎨 UI Implementada

- **Toggle de facturación** para cambiar entre Mensual/Anual
- **Badge "Ahorra 1 mes"** visible cuando se selecciona el plan anual
- **Precio actualizado dinámicamente** ($299 vs $3,289)
- **Mensaje de ahorro** bajo el precio anual: "¡Equivalente a 11 meses! Ahorra $299 MXN"
- **Traducciones** completas en español e inglés
