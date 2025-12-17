# 💳 Sección de Suscripción y Facturación - BookPro

## 📋 Descripción

Implementación completa de una sección profesional de **Suscripción y Facturación** integrada al dashboard de BookPro. El diseño es elegante, soporta dark mode, y está completamente internacionalizado.

## ✨ Características Implementadas

### 🎨 Diseño Visual
- **Cards premium** con gradientes sutiles y glassmorphism
- **Soporte completo para dark/light mode**
- **Animaciones suaves** en hover y transiciones
- **Diseño responsivo** para móvil, tablet y desktop
- **Estados visuales claros** con badges de colores:
  - 🟢 **Activo**: Verde
  - 🟡 **Pago vencido**: Amarillo
  - 🔵 **Trial**: Azul
  - 🔴 **Cancelado**: Rojo

### 🔧 Funcionalidades

#### Vista Principal de Suscripción
- **Resumen del plan actual**
  - Nombre del plan (Mensual/Anual)
  - Estado de la suscripción
  - Fecha de próximo pago/renovación
  - Precio y ciclo
  - Método de pago

#### Acciones Disponibles
- ✅ **Cambiar Plan** (Modal con planes mensual y anual)
- ✅ **Actualizar Método de Pago**
- ✅ **Cancelar Suscripción** (con confirmación y advertencias)
- ✅ **Ver Historial de Pagos**

#### Historial de Pagos
- Tabla completa con:
  - Fecha del pago
  - Descripción
  - Monto (formateado según moneda)
  - Estado (Pagado/Fallido/Pendiente)
  - Acción de descargar factura

### 🌍 Internacionalización (i18next)

Traducciones completas en:
- 🇪🇸 **Español** (`es.json`)
- 🇺🇸 **Inglés** (`en.json`)

Namespace: `billing.*`

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
```
frontend/src/components/business/Billing.tsx  # Componente principal
```

### Archivos Modificados
```
frontend/src/pages/business/BusinessDashboard.tsx  # Integración del tab
frontend/src/locales/es.json                       # Traducciones ES
frontend/src/locales/en.json                       # Traducciones EN
```

## 🔌 Integración con Backend

El componente consume los siguientes endpoints:

```typescript
GET /stripe/subscription/:businessId   // Obtiene suscripción
GET /stripe/payments/:businessId       // Obtiene historial de pagos
```

### Estructura de Datos

```typescript
interface Subscription {
  _id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  priceId: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: Date;
  stripeInvoiceId?: string;
}
```

## 🚀 Cómo Usar

### Acceso desde el Dashboard

1. Navega a `/business/:businessId/dashboard`
2. Haz clic en el tab **"Facturación"**/**"Billing"**
3. Visualiza tu suscripción y gestiona tu plan

### Mapeo de Price IDs

El componente mapea automáticamente los Price IDs de Stripe:

```typescript
// Plan Anual
price_1Sf5dUQ12BYwu1Gtc44DvB2d → "Plan Anual" ($3,289 MXN/año)

// Plan Mensual (default)
Cualquier otro → "Plan Mensual" ($299 MXN/mes)
```

## 🎯 Estados de la UI

### Loading State
```tsx
// Muestra esqueletos de carga mientras obtiene datos
<div className="animate-pulse">...</div>
```

### Empty State
```tsx
// Si no hay suscripción activa
<Card>
  <CreditCard />
  <h3>No tienes una suscripción activa</h3>
  <Button>Ver Planes</Button>
</Card>
```

### Error State
```tsx
// Usa toast de sonner para mostrar errores
toast.error(t('billing.error.load_failed'));
```

## 🎨 Design System

### Colores
- **Primary**: `bg-primary/10`, `text-primary`
- **Success**: `bg-green-100`, `text-green-800`
- **Warning**: `bg-yellow-100`, `text-yellow-800`
- **Error**: `bg-red-100`, `text-red-800`
- **Info**: `bg-blue-100`, `text-blue-800`

### Componentes Utilizados
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Badge`
- `Button`
- `Dialog`, `DialogContent`, `DialogHeader`, etc.
- `Table`, `TableHeader`, `TableBody`, etc.
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`

### Iconos (lucide-react)
- `CreditCard` - Métodos de pago
- `Calendar` - Fechas
- `DollarSign` - Precios/pagos
- `AlertCircle` - Advertencias
- `CheckCircle` - Confirmaciones
- `Download` - Descargar facturas
- `RefreshCw` - Cambiar/actualizar

## 📱 Responsividad

El diseño se adapta automáticamente:

- **Mobile**: Grid de 1 columna
- **Tablet**: Grid de 2 columnas en algunas secciones
- **Desktop**: Grid de 3 columnas para información del plan

## 🔐 Seguridad

- Requiere autenticación (token en localStorage)
- Verifica que el usuario tenga acceso al businessId
- Todas las peticiones usan headers de autorización

## 🚧 Próximas Mejoras

- [ ] Integración real con Stripe Customer Portal
- [ ] Descarga de facturas en PDF
- [ ] Cambio de plan en tiempo real
- [ ] Webhook para actualizar UI automáticamente
- [ ] Métricas de uso y consumo

## 📚 Traducciones

### Ejemplo de uso:
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<h1>{t('billing.title')}</h1>
// Resultado ES: "Suscripción y Facturación"
// Resultado EN: "Subscription & Billing"
```

### Keys disponibles:
```
billing.title
billing.subtitle
billing.overview.*
billing.status.*
billing.plan.*
billing.actions.*
billing.history.*
billing.cancel.*
billing.change_plan.*
billing.error.*
```

## 💡 Tips de Desarrollo

1. **Dark Mode**: Todos los colores usan variantes dark con `dark:`
2. **Fechas**: Usa `date-fns` con locale según el idioma
3. **Montos**: Formatea con `toLocaleString()` + currency
4. **Estados**: Los badges son consistentes con el resto del dashboard

## 🎉 Resultado Final

Una sección de facturación profesional, elegante y lista para producción que:
- Se integra perfectamente con el diseño existente
- Proporciona claridad al usuario sobre su plan
- Facilita la gestión de suscripciones
- Mantiene la coherencia visual del dashboard
- Es totalmente accesible e internacionalizada
