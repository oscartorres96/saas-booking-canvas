# 🔍 AUDITORÍA COMPLETA Y HARDENING - FLUJO BOOKING & PURCHASE
## BookPro - Production Ready Assessment

**Fecha:** 20 de Diciembre 2025  
**Objetivo:** Auditar, documentar y fortalecer el flujo completo de reservas y compras  
**Alcance:** End-to-end desde QR hasta confirmación final

---

## 📊 EXECUTIVE SUMMARY

### Estado Actual del Sistema
- ✅ **Funcional**: El flujo básico de booking funciona
- ⚠️ **Hardening necesario**: Edge cases y estados inconsistentes detectados
- 🎯 **Objetivo**: Production-ready con 0 edge cases rotos

### Componentes Principales Identificados

#### Frontend
- `BusinessBookingPage.tsx` (1789 líneas) - Componente principal del flujo
- `AnimatedStepper.tsx` - Control de pasos
- `ServiceCard.tsx` - Visualización de servicios
- `ProductsStore.tsx` - Tienda de paquetes

#### Backend
- `bookings.service.ts` - Lógica de negocio de reservas
- `customer-assets.service.ts` - Gestión de paquetes/créditos
- `stripe.service.ts` - Integración de pagos
- `products.service.ts` - Gestión de productos

---

## 🚪 PARTE 1: PUNTOS DE ENTRADA (Links & QR)

### 1.1 Rutas Identificadas

#### Ruta Principal de Booking
```
/business/:businessId/booking
```

#### Query Parameters Soportados
```typescript
// Servicio específico
?serviceId=xxxxx

// Paquete específico  
?packageId=xxxxx

// Pre-fill de datos
?name=xxxxx&email=xxxxx&phone=xxxxx

// Post-pago
?success=true&action=book_after_purchase&serviceId=...&date=...&time=...
```

### 1.2 Análisis de Entrada vía QR

#### ✅ QR a Servicio Específico
**URL:** `/business/:businessId/booking?serviceId=SERVICE_ID`

**Comportamiento actual:**
```typescript
// Líneas 606-620 de BusinessBookingPage.tsx
const serviceIdParam = searchParams.get("serviceId");
if (serviceIdParam && services.length > 0) {
    const service = services.find(s => s._id === serviceIdParam);
    if (service) {
        if (form.getValues("serviceId") !== serviceIdParam) {
            handleServiceSelect(serviceIdParam);
        }
    }
}
```

**Estado:** ✅ Funcional  
**Issues detectados:**
1. 🔴 **No hay validación si el servicio está inactivo** - Puede pre-seleccionar servicio deshabilitado
2. 🟡 **No hay feedback visual** cuando se entra vía QR vs entrada manual
3. 🟡 **Depende de que services.length > 0** - Race condition potencial

#### ⚠️ QR a Paquete Específico
**URL:** `/business/:businessId/booking?packageId=PACKAGE_ID`

**Comportamiento actual:**
```typescript
// Líneas 622-631
const packageIdParam = searchParams.get("packageId");
if (packageIdParam && products.length > 0) {
    const product = products.find(p => p._id === packageIdParam);
    if (product) {
        setActiveFilter('packages');
        if (form.getValues("productId") !== packageIdParam) {
            handleBuyPackage(product);
        }
    }
}
```

**Estado:** ⚠️ Funcional con issues  
**Issues detectados:**
1. 🔴 **handleBuyPackage salta directamente a step 3** sin dar contexto al usuario
2. 🔴 **No valida si el paquete está activo**
3. 🟡 **UX confusa**: El usuario ve "Paso 3" sin haber completado pasos 1 y 2
4. 🟡 **No hay breadcrumb** que indique "Entraste vía QR de [Paquete X]"

---

## 📝 PARTE 2: PASO 1 - SELECCIÓN DE SERVICIO/PAQUETE

### 2.1 Estados Posibles

1. **Entrada limpia** (sin query params)
2. **Entrada con servicio preseleccionado** (QR)
3. **Entrada con paquete preseleccionado** (QR)
4. **Vuelta desde paso 2 o 3**

### 2.2 Componentes Involucrados

#### Búsqueda y Filtros
```typescript
// Líneas 771-800
- Search bar ✅
- Filtros: Todos / Presencial / Online / Ver Paquetes ✅
- Responsive ✅
```

**Estado:** ✅ Funcional

#### Visualización de Servicios
```typescript
// ServiceCard.tsx
- Muestra nombre, duración, precio
- Botón "Elegir Servicio"
- Indica si requiere paquete
```

**Issues detectados:**
1. 🟡 **No muestra indicador de "Inactivo"** si service.active === false
2. 🟡 **No valida service.active** antes de permitir selección

#### Visualización de Paquetes
```typescript
// ProductsStore.tsx
- Modal/sección de paquetes
- Muestra precio, usos, validez
```

**Issues detectados:**
1. 🔴 **Estado de carga**: No se valida si products están cargando
2. 🔴 **Paquetes inactivos**: Podrían mostrarse si active: false

### 2.3 Lógica de Selección

#### handleServiceSelect
```typescript
// Líneas 247-260
const handleServiceSelect = (serviceId: string) => {
    form.setValue("serviceId", serviceId);
    setSelectedProduct(null);  // ✅ Limpia paquete
    form.setValue("productId", undefined);  // ✅ Correcto
    
    if (serviceId) {
        const service = services.find(s => s._id === serviceId);
        setSelectedService(service || null);
        setStep(2); // ✅ Avanza a calendario
    }
};
```

**Estado:** ✅ Funcional  
**Mejoras sugeridas:**
1. ⚠️ Validar que el servicio no esté inactivo
2. ⚠️ Limpiar fecha/hora si ya estaban seleccionadas

#### handleBuyPackage
```typescript
// Líneas 388-394
const handleBuyPackage = (product: Product) => {
    setSelectedProduct(product);
    form.setValue('productId', product._id);
    form.setValue('assetId', undefined);  // ✅ Correcto
    toast.info(`Has seleccionado: ${product.name}`);
    setStep(3); // 🔴 PROBLEMA: Salta a paso 3 directamente
};
```

**Estado:** 🔴 Issues críticos  
**Problemas:**
1. **Salta paso 2 (Horario)**: Usuario no entiende que debe reservar después
2. **No diferencia entre**:
   - Comprar paquete **solo** (sin reserva inmediata)
   - Comprar paquete **+ reservar** (requiere paso 2)

---

## 📅 PARTE 3: PASO 2 - SELECCIÓN DE HORARIO

### 3.1 Componentes

#### Calendar (Popover)
```typescript
// useSlots hook integrado
isDateDisabled(date) // ✅ Valida días cerrados
```

**Estado:** ✅ Funcional

#### Validación de Fechas Deshabilitadas
```typescript
// Líneas 645-672
const isDateDisabled = (date: Date) => {
    // ✅ Deshabilita fechas pasadas
    // ✅ Lee businessHours
    // ✅ Valida intervalos
}
```

**Estado:** ✅ Funcional

### 3.2 Selección de Slots

#### useSlots Hook
```typescript
const { data: slots, isLoading: isLoadingSlots } = useSlots(
    businessId,
    selectedDate,
    selectedServiceId
);
```

**Issues potenciales:**
1. 🟡 **Race conditions**: ¿Qué pasa si cambia servicio mientras carga slots?
2. 🔴 **No hay manejo de "sin horarios disponibles"** - UI debe mostrar mensaje claro
3. 🟡 **Bloqueo de slots ocupados**: Necesita verificación en backend

### 3.3 Edge Cases

#### ❌ Caso: No hay horarios disponibles
**Escenario:** Servicio seleccionado pero todos los slots ocupados  
**Expected:** Mensaje claro "No hay horarios disponibles para esta fecha. Intenta con otra."  
**Actual:** ⚠️ Necesita verificación

#### ❌ Caso: Servicio cambia después de seleccionar fecha/hora
**Escenario:** Usuario selecciona Servicio A → elige fecha/hora → vuelve y cambia a Servicio B  
**Expected:** Fecha/hora se resetean  
**Actual:** ⚠️ Verificar si se limpia correctamente

---

## 👤 PARTE 4: PASO 3 - DATOS DEL CLIENTE

### 4.1 Formulario de Datos

#### Campos Requeridos
```typescript
clientName: z.string().min(3),
clientEmail: z.string().email(),
clientPhone: z.string().min(8),
```

**Estado:** ✅ Validación correcta

#### Auto-fill para Usuarios Logueados
```typescript
// Líneas 141-143
clientName: user?.name || "",
clientEmail: user?.email || "",
clientPhone: "",
```

**Estado:** ✅ Funcional

### 4.2 Búsqueda Automática de Paquetes/Créditos

#### Lógica de Detección
```typescript
// Líneas 191-236: fetchAssetsForContact
// ✅ Usa OR: email || phone
// ✅ Debounce de 1 segundo
// ✅ Solo para usuarios guest (no autenticados)
```

**Estado:** ✅ Funcional  
**Edge cases a verificar:**
1. ✅ Usuario tiene paquete válido → auto-selección
2. ⚠️ Usuario tiene paquete **vencido** → ¿Se muestra? ¿Se filtra?
3. ⚠️ Usuario tiene **varios paquetes** → ¿Priorización?
4. ✅ No tiene paquetes → No pasa nada

#### Auto-selección de Assets
```typescript
// Líneas 217-228
if (compatibleAssets.length > 0) {
    const currentAssetId = form.getValues('assetId');
    const isCurrentStillValid = compatibleAssets.some(a => a._id === currentAssetId);
    
    if (!currentAssetId || !isCurrentStillValid) {
        form.setValue('assetId', compatibleAssets[0]._id);  // ✅ Selecciona primero
        setActiveTab('credits');
        toast.success(`¡Encontramos tus créditos!`);
    }
}
```

**Estado:** ⚠️ Funcional con mejoras necesarias  
**Issues:**
1. 🔴 **Priorización no clara**: ¿Qué pasa si hay 3 paquetes compatibles?
2. 🔴 **Paquetes ilimitados vs limitados**: No hay lógica de prioridad
3. 🔴 **Fecha de expiración**: No prioriza "vence antes"

### 4.3 Validación de Compatibilidad

```typescript
// Líneas 211-214
const compatibleAssets = assets.filter(asset => {
    if (!selectedServiceId) return true;
    const allowed = asset.productId?.allowedServiceIds;
    return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId);
});
```

**Estado:** ✅ Correcto  
**Lógica:**
- Si `allowedServiceIds` está vacío → aplica a todos
- Si tiene IDs → valida que incluya el servicio actual

---

## 💳 PARTE 5: USO DE PAQUETES/CRÉDITOS

### 5.1 Lógica Backend de Consumo

#### consumeUse (customer-assets.service.ts)
```typescript
// Líneas 78-149
async consumeUse(assetId: string, verificationContact?: { email?: string; phone?: string }) {
    // ✅ Verifica ownership (email o phone)
    // ✅ Atomic update (findOneAndUpdate)
    // ✅ Manejo de ilimitados
    // ✅ Decrementa remainingUses
    // ✅ Marca como Consumed si remainingUses === 0
}
```

**Estado:** ✅ Robusto  
**Protecciones:**
1. ✅ Ownership validation
2. ✅ Atomic decrement (previene race conditions)
3. ✅ Validación de expiración
4. ✅ Estado activo

### 5.2 Casos Edge de Consumo

#### ✅ Caso: Consumo exitoso
**Expected:** `remainingUses--`, `timesUsed++`, `lastUsedAt` actualizado  
**Actual:** ✅ Correcto

#### ⚠️ Caso: Doble consumo (race condition)
**Escenario:** Usuario hace doble click en "Confirmar reserva"  
**Expected:** Solo se crea 1 booking, solo se consume 1 crédito  
**Actual:** 🔴 **CRÍTICO** - Necesita verificación. Frontend debería deshabilitar botón.

#### ✅ Caso: Asset vencido
**Expected:** Error "El paquete ha expirado"  
**Actual:** ✅ Validado en líneas 121-125 del service

#### ✅ Caso: Sin usos restantes
**Expected:** Error "No tienes créditos disponibles"  
**Actual:** ✅ Validado (line 128: `remainingUses: { $gt: 0 }`)

#### ⚠️ Caso: Asset no pertenece al usuario
**Expected:** Error claro  
**Actual:** ✅ Validado pero mensaje podría ser más claro

---

## 💰 PARTE 6: FLUJO DE PAGO (Stripe)

### 6.1 Escenarios de Pago

#### A) Pago de Servicio Suelto (Sin paquete)
**Flujo:** Usuario selecciona servicio → horario → datos → paga  
**Estado actual:** ⚠️ **NO IMPLEMENTADO COMPLETAMENTE**

**Evidencia:**
```typescript
// onSubmit (líneas 437-453)
if (values.productId && !values.assetId) {
    // Solo maneja pago de PAQUETE
    const checkout = await createProductCheckout({...});
}
// Pero NO hay else if para pago de servicio individual
```

**🔴 CRÍTICO:** Este camino necesita implementación si se soporta pay-per-session

#### B) Compra de Paquete (Sin reserva inmediata)
**URL resultado:** `?success=true&type=product`  
**Estado:** ⚠️ Funcional pero incompleto

**Issues:**
1. 🔴 No hay UX clara post-compra: "¿Qué hago ahora?"
2. 🔴 No redirige automáticamente a "Hacer reserva"

#### C) Compra de Paquete + Reserva Inmediata
**URL resultado:** `?success=true&action=book_after_purchase&serviceId=...&date=...&time=...`  
**Estado:** 🔴 Issues críticos

**Código actual (líneas 506-598):**
```typescript
const performPostPaymentBooking = async () => {
    // Espera 2 segundos para webhook
    await new Promise(r => setTimeout(r, 2000));
    
    // Pre-llena formulario
    handleServiceSelect(sId);
    form.setValue("date", new Date(dateStr));
    form.setValue("time", timeStr);
    
    toast.success("¡Paquete comprado! Ahora confirma tu reserva.");
    // 🔴 PROBLEMA: Usuario debe hacer click OTRA VEZ en confirmar
};
```

**Problemas:**
1. 🔴 **UX confusa**: Usuario piensa que ya reservó, pero debe confirmar de nuevo
2. 🔴 **No auto-asigna asset**: Depende de que usuario confirme manualmente
3. 🟡 **Delay de 2s arbitrario**: Webhook podría tardar más o menos
4. 🔴 **No maneja fallo de webhook**: Si webhook falla, usuario queda en limbo

#### D) Cancelación de Pago
**Estado:** ⚠️ Necesita verificación  
**Expected:** Vuelve a la página, mantiene selección  
**Actual:** ⚠️ Por confirmar

### 6.2 Webhook Handlers

#### handleProductPaymentCompleted (stripe.service.ts L649-673)
```typescript
async handleProductPaymentCompleted(session: Stripe.Checkout.Session) {
    const { productId, businessId, clientEmail, clientPhone } = metadata;
    
    // ✅ Crea customer asset
    await this.customerAssetsService.createFromPurchase(
        businessId, clientEmail, productId, clientPhone
    );
}
```

**Estado:** ✅ Funcional  
**Validación:**
1. ✅ Crea asset correctamente
2. ✅ Vincula email/teléfono
3. ⚠️ No envía email de confirmación de compra

### 6.3 Idempotencia

#### ⚠️ Prevención de Duplicados
**Issue:** ¿Qué pasa si webhook se ejecuta 2 veces?  
**Expected:** No crear assets duplicados  
**Actual:** 🔴 **CRÍTICO** - No hay validación de sessionId único

**Recomendación:**
```typescript
// Agregar a CustomerAsset schema
stripeSessionId?: string;  // Unique index

// Validar en createFromPurchase
const existing = await this.assetModel.findOne({ stripeSessionId: session.id });
if (existing) return existing;  // Ya procesado
```

---

## ✅ PARTE 7: PASO 4 - CONFIRMACIÓN FINAL

### 7.1 Resumen Pre-Confirmación

**Información mostrada:**
- Servicio seleccionado ✅
- Fecha y hora ✅
- Datos del cliente ✅
- Método de pago ⚠️ (necesita verificación)
- Paquete usado (si aplica) ⚠️ (necesita verificación)

### 7.2 Lógica de Envío (onSubmit)

```typescript
// Líneas 396-488
async onSubmit(values) {
    // Validaciones
    if (selectedService?.requireResource && !selectedResourceId) { ... }  // ✅
    if (values.serviceId && (!values.date || !values.time)) { ... }  // ✅
    if (!values.serviceId && !values.productId) { ... }  // ✅
    
    // Crear booking data
    const bookingData = {
        businessId,
        serviceId: values.serviceId,
        scheduledAt,
        assetId: values.assetId,  // ✅ Incluye asset si existe
        // ...
    };
    
    // Si compra paquete → Checkout
    if (values.productId && !values.assetId) {
        const checkout = await createProductCheckout({...});
        window.location.href = checkout.url;
        return;
    }
    
    // Si usa crédito o no necesita pago → Crear booking directo
    const booking = await createBooking(bookingData);
    setBookingSuccess(true);
}
```

**Estado:** ✅ Funcional  
**Edge cases cubiertos:**
1. ✅ Valida recurso si es necesario
2. ✅ Valida fecha/hora si se seleccionó servicio
3. ✅ Requiere servicio o paquete
4. ✅ Maneja conflictos (BOOKING_ALREADY_EXISTS)

### 7.3 Creación de Reserva (Backend)

#### bookings.service.ts - create()

**Validaciones:**
```typescript
// ✅ Business existe
// ✅ Servicio existe y está activo
// ✅ Servicio pertenece al negocio
// ✅ Prevención de doble reserva (si allowMultipleBookingsPerDay: false)
// ✅ Require product validation
// ✅ Consume asset si se proporciona
```

**Estado:** ✅ Robusto

**Edge case crítico - Doble reserva:**
```typescript
// Líneas 96-127
if (!business.bookingConfig?.allowMultipleBookingsPerDay) {
    // Busca reserva existente para:
    // - Mismo día
    // - Mismo email O userId O phone
    // - No cancelada
    
    if (existingBooking) {
        throw new ConflictException({
            message: 'Ya tienes una reserva para este día...',
            code: 'BOOKING_ALREADY_EXISTS',
            accessCode: existingBooking.accessCode
        });
    }
}
```

**Estado:** ✅ Correcto  
**Manejo en frontend:**
```typescript
// Líneas 478-484
if (errData?.code === "BOOKING_ALREADY_EXISTS") {
    setConflictError({
        message: t('booking.form.toasts.booking_conflict_error'),
        accessCode: errData.accessCode,
        clientEmail: values.clientEmail
    });
    return;
}
```

**Estado:** ✅ UX apropiada

### 7.4 Pantalla de Éxito

```typescript
// bookingSuccess state
if (bookingSuccess) {
    // Muestra resumen de reserva
    // Código de acceso
    // Botón "Nueva reserva"
}
```

**Issues:**
1. ⚠️ No se ve en el código provided - necesita verificación completa
2. 🔴 **¿Se envía email de confirmación?** - Verificar NotificationService

---

## 🚨 PARTE 8: UX & ESTADOS DE ERROR

### 8.1 Estados de Carga

#### ✅ Loading General
```typescript
if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse">...</div>
        </div>
    );
}
```

#### ⚠️ Loading de Slots
**Actual:** `isLoadingSlots` existe pero no se muestra spinner en UI  
**Recomendado:** Agregar skeleton en sección de horarios

#### ⚠️ Loading de Assets
**Actual:** `isCheckingAssets` existe pero no hay feedback visual  
**Recomendado:** Spinner pequeño junto a campos de email/teléfono

### 8.2 Mensajes de Error

#### ✅ Errores Técnicos → Humanos
```typescript
catch (error: any) {
    const errData = error?.response?.data;
    toast.error(errData?.message || t('booking.form.toasts.error_desc'));
}
```

**Estado:** ✅ Funcional (usa mensajes del backend + fallback)

#### Mejoras Sugeridas

**Backend - Mensajes claros:**
```typescript
// ❌ Actual
throw new BadRequestException('Asset not found');

// ✅ Sugerido
throw new BadRequestException('No encontramos tu paquete. Por favor verifica que el código sea correcto o contacta a soporte.');
```

### 8.3 Fallbacks

#### ❌ Caso: Business no existe
**Actual:** Muestra página de error ✅  
**Mejora:** Link a página principal

#### ❌ Caso: No hay servicios activos
**Actual:** ⚠️ Probablemente muestra lista vacía  
**Mejora:** Mensaje "Este negocio aún no tiene servicios disponibles"

#### ❌ Caso: No hay slots disponibles
**Actual:** ⚠️ Por verificar  
**Mejora:** "No hay horarios disponibles. Intenta con otra fecha."

---

## 🎯 MATRIZ DE CASOS DE USO

| # | Escenario | Path | Expected | Status | Priority |
|---|-----------|------|----------|--------|----------|
| 1 | Usuario accede vía QR a servicio | `/business/X/booking?serviceId=Y` | Pre-selecciona servicio, muestra step 1 con servicio destacado | ⚠️ | P1 |
| 2 | Usuario accede vía QR a paquete | `/business/X/booking?packageId=Y` | Pre-selecciona paquete, muestra modal/detalle | 🔴 | P0 |
| 3 | Usuario selecciona servicio manualmente | Normal flow | Step 1 → 2 → 3 → 4 | ✅ | - |
| 4 | Usuario tiene créditos al ingresar email | Auto-detect | Auto-selecciona asset compatible, muestra toast | ✅ | - |
| 5 | Usuario **no** tiene créditos | Auto-detect | No pasa nada, continúa normal | ✅ | - |
| 6 | Usuario tiene crédito **vencido** | Auto-detect | No lo muestra en opciones | ⚠️ | P1 |
| 7 | Usuario tiene **varios** créditos válidos | Auto-detect | Muestra todos, prioriza por fecha de expiración | 🔴 | P0 |
| 8 | Servicio requiere paquete, usuario no tiene | onSubmit | Error claro: "Necesitas comprar un paquete primero" | ✅ | - |
| 9 | Usuario selecciona servicio inactivo | Step 1 | No debería permitir selección | 🔴 | P1 |
| 10 | Usuario intenta reservar fecha pasada | Calendar | Fecha deshabilitada | ✅ | - |
| 11 | Usuario intenta reservar día cerrado | Calendar | Fecha deshabilitada | ✅ | - |
| 12 | Slot ya ocupado (race condition) | onSubmit | Error backend: "Horario no disponible" | ⚠️ | P0 |
| 13 | Usuario compra paquete solo | Checkout flow | Webhook crea asset → email confirmación | ⚠️ | P1 |
| 14 | Usuario compra paquete + reserva | Checkout flow | Webhook crea asset → auto-crea booking | 🔴 | P0 |
| 15 | Webhook falla/demora | Post-checkout | Sistema resiliente, permite retry | 🔴 | P0 |
| 16 | Usuario cancela pago | Stripe redirect | Vuelve a booking page, mantiene selección | ⚠️ | P2 |
| 17 | Doble click en "Confirmar reserva" | onSubmit | Solo crea 1 booking, botón disabled | 🔴 | P0 |
| 18 | Doble reserva mismo día | Backend validation | Error si config no permite | ✅ | - |
| 19 | Asset usado por otro usuario | consumeUse | Error: "Paquete no te pertenece" | ✅ | - |
| 20 | Usuario sin email/teléfono | Validation | Error en form: "Requerido" | ✅ | - |

**Leyenda:**
- ✅ = Funcional
- ⚠️ = Funcional con mejoras necesarias
- 🔴 = Issue crítico / No funciona correctamente
- P0 = Crítico (bloquea producción)
- P1 = Alto (debe resolverse pre-prod)
- P2 = Medio (mejora UX)

---

## 🔧 PLAN DE HARDENING - PRIORIZADO

### 🔴 P0: CRÍTICO (Bloquean Producción)

#### 1. Flujo QR → Paquete  
**Problema:** UX confusa, salta pasos  
**Solución:** 
- Detectar `packageId` param
- Mostrar modal de paquete con CTA claro: "Comprar" o "Comprar y Reservar"
- Si elige "Comprar y Reservar" → pre-selecciona paquete + muestra step 1-2 normales + en step 4 procesa compra+reserva

#### 2. Priorización de Assets Múltiples  
**Problema:** Si usuario tiene 3 paquetes compatibles, auto-selecciona [0] sin criterio  
**Solución:**
```typescript
// Ordenar por expiración (más próximo primero) + priorizar limitados sobre ilimitados
const sortedAssets = compatibleAssets.sort((a, b) => {
    if (a.isUnlimited && !b.isUnlimited) return 1;
    if (!a.isUnlimited && b.isUnlimited) return -1;
    if (a.expiresAt && b.expiresAt) {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    return 0;
});
form.setValue('assetId', sortedAssets[0]._id);
```

#### 3. Doble Submit (Race Condition)  
**Problema:** Usuario puede hacer doble click en "Confirmar"  
**Solución:**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const onSubmit = async (values) => {
    if (isSubmitting) return;  // ← Guard
    setIsSubmitting(true);
    try {
        // ... lógica actual
    } finally {
        setIsSubmitting(false);
    }
};

// En botón:
<Button disabled={isSubmitting || !isValid}>
    {isSubmitting ? "Procesando..." : "Confirmar Reserva"}
</Button>
```

#### 4. Webhook Idempotencia  
**Problema:** Webhook puede ejecutarse 2+ veces → duplica assets  
**Solución:**
```typescript
// En CustomerAsset schema:
@Prop({ unique: true, sparse: true })
stripeSessionId?: string;

// En createFromPurchase:
const existing = await this.assetModel.findOne({ 
    stripeSessionId: session.id 
});
if (existing) {
    this.logger.log(`Asset already created for session ${session.id}`);
    return existing;
}

const asset = new this.assetModel({
    // ... datos actuales
    stripeSessionId: session.id,
});
```

#### 5. Flujo "Comprar Paquete + Reservar"  
**Problema:** UX confusa, requiere confirmación manual post-pago  
**Solución:** 
- **Opción A (Recomendada):** En `successUrl`, incluir `booking_data` completo
- Webhook crea asset **y** booking automáticamente
- Frontend solo muestra pantalla de éxito

```typescript
// En stripe.service handleProductPaymentCompleted
const bookingDataParam = metadata.bookingData;
if (bookingDataParam) {
    const bookingData = JSON.parse(bookingDataParam);
    
    // Crear asset
    const asset = await this.customerAssetsService.createFromPurchase(...);
    
    // Crear booking automáticamente
    await this.bookingsService.create({
        ...bookingData,
        assetId: asset._id,
    }, { role: 'public' });
}
```

#### 6. Validación de Slots Disponibles (Backend)  
**Problema:** No se valida en backend si slot está ocupado  
**Solución:**
```typescript
// En bookings.service.create(), antes de guardar:
const slotOccupied = await this.bookingModel.findOne({
    businessId: payload.businessId,
    serviceId: payload.serviceId,
    scheduledAt: payload.scheduledAt,
    status: { $ne: BookingStatus.Cancelled },
});

if (slotOccupied) {
    throw new ConflictException('Este horario ya no está disponible. Por favor elige otro.');
}
```

---

### 🟡 P1: ALTO (Pre-Producción)

#### 7. Validar Servicio Activo  
**Implementar en:**
- `handleServiceSelect`: validar `service.active !== false`
- Backend: ya valida ✅
- UI: No mostrar servicios inactivos en lista

#### 8. Assets Vencidos - Filtrado Frontend  
**Problema:** Podrían mostrarse en dropdown  
**Solución:**
```typescript
const now = new Date();
const validAssets = availableAssets.filter(asset => {
    if (asset.expiresAt && new Date(asset.expiresAt) < now) return false;
    if (!asset.isUnlimited && asset.remainingUses <= 0) return false;
    return true;
});
```

#### 9. Email de Confirmación de Compra de Paquete  
**Implementar:**
```typescript
// En handleProductPaymentCompleted (stripe.service)
await this.notificationService.sendPackagePurchaseConfirmation({
    email: clientEmail,
    packageName: product.name,
    // ...
});
```

#### 10. Reseteo de Fecha/Hora al Cambiar Servicio  
**Problema:** Si usuario cambia servicio, horario puede quedar inconsistente  
**Solución:**
```typescript
const handleServiceSelect = (serviceId: string) => {
    // ... código actual
    
    // Limpiar fecha/hora si ya estaban seleccionadas
    form.setValue("date", undefined);
    form.setValue("time", "");
    
    setStep(2);
};
```

#### 11. Indicador Visual de Entrada vía QR  
**UX Mejora:**
```tsx
{preselectedFrom === 'qr' && (
    <Badge variant="secondary">
        <Sparkles className="w-3 h-3 mr-1" />
        Acceso vía QR
    </Badge>
)}
```

---

### 🔵 P2: MEDIO (Mejoras UX)

#### 12. Skeleton Loading para Slots
#### 13. Mensaje "No hay horarios disponibles"
#### 14. Breadcrumb en Stepper
#### 15. Confirmación de cancelación de pago

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Hardening Crítico (P0)
- [ ] 1. Refactor flujo QR → Paquete
- [ ] 2. Implementar priorización de assets múltiples
- [ ] 3. Agregar guard doble submit
- [ ] 4. Webhook idempotencia (stripeSessionId)
- [ ] 5. Auto-booking post-compra paquete
- [ ] 6. Validación backend de slot ocupado

### Fase 2: Validaciones (P1)
- [ ] 7. Filtrar servicios inactivos
- [ ] 8. Filtrar assets vencidos
- [ ] 9. Email confirmación compra paquete
- [ ] 10. Reset fecha/hora al cambiar servicio
- [ ] 11. Badge indicador QR

### Fase 3: Pulido UX (P2)
- [ ] 12. Skeleton slots
- [ ] 13. Mensaje "sin horarios"
- [ ] 14. Breadcrumb
- [ ] 15. Confirmación cancelación

### Fase 4: Testing
- [ ] End-to-end: Todos los 20 casos de uso
- [ ] Pruebas de stress: Race conditions
- [ ] Webhook reliability: Reintentos
- [ ] Mobile responsive: Todos los pasos

---

## 📝 NOTAS TÉCNICAS

### Arquitectura Actual

**Fortalezas:**
- ✅ Separación clara: Frontend (BusinessBookingPage) ↔ Backend (BookingsService)
- ✅ Atomic operations en consumeUse
- ✅ Validaciones robustas en backend
- ✅ Hook `useSlots` desacoplado
- ✅ Componentes modulares (ServiceCard, ProductsStore)

**Deudas Técnicas:**
- ⚠️ BusinessBookingPage demasiado grande (1789 líneas) - considerar refactor
- ⚠️ Lógica de negocio mezclada con UI
- ⚠️ Estados locales complejos (14+ useState)

**Recomendación futura:**
- Extraer lógica a custom hooks:
  - `useBookingFlow()` - manejo de steps
  - `useAssetDetection()` - búsqueda automática
  - `useQRParams()` - parsing de query params

---

## 🎯 DEFINICIÓN DE "PRODUCTION READY"

### Criterios de Aceptación

1. ✅ **Funcionalidad Completa**
   - Todos los 20 casos de uso pasan
   - 0 edge cases rotos

2. ✅ **Seguridad**
   - No hay race conditions
   - Ownership validation en todos los endpoints
   - Idempotencia en webhooks

3. ✅ **UX Clara**
   - Mensajes de error humanos
   - Estados de carga visibles
   - Flujo intuitivo sin fricción

4. ✅ **Resilencia**
   - Manejo de fallos de Stripe
   - Timeouts configurables
   - Logs completos para debugging

5. ✅ **Performance**
   - Tiempos de carga < 2s
   - Optimistic updates donde sea posible
   - Debouncing en búsquedas

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar este documento** con el equipo
2. **Priorizar fixes** según impacto
3. **Implementar P0** (1-6)
4. **Testing exhaustivo** de P0
5. **Implementar P1** (7-11)
6. **Testing end-to-end** completo
7. **Deploy a staging**
8. **QA final**
9. **Deploy a producción**

---

**Documento creado:** 2025-12-20  
**Autor:** Antigravity AI  
**Versión:** 1.0  
**Estado:** Listo para revisión
