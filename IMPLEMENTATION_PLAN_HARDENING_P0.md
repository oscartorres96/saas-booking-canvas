# 🛠️ PLAN DE IMPLEMENTACIÓN - HARDENING P0 (CRÍTICO)
## BookPro - Fixes de Production Blocking

**Objetivo:** Resolver los 6 issues críticos (P0) que bloquean el lanzamiento a producción  
**Timeline estimado:** 2-3 días de desarrollo + 1 día testing  
**Impacto:** 100% del flujo de compra y reserva

---

## 📋 RESUMEN DE FIXES P0

| # | Issue | Impacto | Complejidad | Archivos Afectados |
|---|-------|---------|-------------|-------------------|
| 1 | Flujo QR → Paquete | Alto | Media | `BusinessBookingPage.tsx` |
| 2 | Priorización Assets | Alto | Baja | `BusinessBookingPage.tsx` |
| 3 | Doble Submit | Crítico | Baja | `BusinessBookingPage.tsx` |
| 4 | Webhook Idempotencia | Crítico | Media | `customer-asset.schema.ts`, `stripe.service.ts` |
| 5 | Auto-Booking Post-Compra | Alto | Alta | `stripe.service.ts`, `BusinessBookingPage.tsx` |
| 6 | Validación Slot Ocupado | Crítico | Media | `bookings.service.ts` |

---

## 🔧 FIX #1: FLUJO QR → PAQUETE

### 📊 Problema Actual

Cuando usuario escanea QR de paquete:
1. URL: `/business/ABC/booking?packageId=XYZ`
2. handleBuyPackage() se ejecuta
3. Salta directamente a step 3
4. Usuario ve "Tus Datos" sin contexto

**Usuario piensa:** "¿Por qué estoy en paso 3? ¿Qué pasó con el paquete?"

### ✅ Solución Propuesta

**Nuevo flujo:**
1. Detectar `packageId` en URL
2. Mostrar modal/card destacado del paquete en Step 1
3. Presentar 2 opciones claras:
   - **"Comprar Ahora"** → Solo compra paquete (sin reserva)
   - **"Comprar y Reservar Hoy"** → Compra + flujo de reserva

### 📝 Cambios de Código

#### A) Agregar estado para pre-selección de paquete

```typescript
// BusinessBookingPage.tsx - Línea ~118
const [preSelectedPackage, setPreSelectedPackage] = useState<Product | null>(null);
const [showPackageModal, setShowPackageModal] = useState(false);
```

#### B) Modificar useEffect de packageId

```typescript
// Reemplazar líneas 622-631
useEffect(() => {
    const packageIdParam = searchParams.get("packageId");
    
    if (packageIdParam && products.length > 0 && !preSelectedPackage) {
        const product = products.find(p => p._id === packageIdParam);
        
        if (product && product.active) {  // ✅ Validar activo
            setPreSelectedPackage(product);
            setShowPackageModal(true);  // ✅ Mostrar modal
            setActiveFilter('packages');
        } else if (product && !product.active) {
            toast.error("Este paquete ya no está disponible.");
        }
    }
}, [searchParams, products, preSelectedPackage]);
```

#### C) Crear componente PackageQRModal

```tsx
// Nuevo archivo: src/components/booking/PackageQRModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

interface PackageQRModalProps {
    product: Product;
    open: boolean;
    onClose: () => void;
    onBuyOnly: () => void;
    onBuyAndBook: () => void;
}

export const PackageQRModal = ({ product, open, onClose, onBuyOnly, onBuyAndBook }: PackageQRModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <Badge variant="secondary">Acceso vía QR</Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold">
                        {product.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Detalles del paquete */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Precio</span>
                            <span className="font-bold">${product.price} MXN</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Incluye</span>
                            <span className="font-bold">
                                {product.isUnlimited ? 'Clases Ilimitadas' : `${product.totalUses} clases`}
                            </span>
                        </div>
                        {product.validityDays && (
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Vigencia</span>
                                <span className="font-bold">{product.validityDays} días</span>
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                    )}

                    {/* Botones de acción */}
                    <div className="space-y-3 pt-2">
                        <Button 
                            size="lg" 
                            className="w-full gap-2" 
                            onClick={onBuyAndBook}
                        >
                            <Zap className="w-4 h-4" />
                            Comprar y Reservar Hoy
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                            size="lg" 
                            variant="outline" 
                            className="w-full" 
                            onClick={onBuyOnly}
                        >
                            Solo Comprar Paquete
                        </Button>

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full" 
                            onClick={onClose}
                        >
                            Ver otros servicios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
```

#### D) Integrar modal en BusinessBookingPage

```tsx
// En BusinessBookingPage.tsx, dentro del return (antes del cierre del div principal)

{preSelectedPackage && (
    <PackageQRModal
        product={preSelectedPackage}
        open={showPackageModal}
        onClose={() => {
            setShowPackageModal(false);
            setPreSelectedPackage(null);
        }}
        onBuyOnly={() => {
            setShowPackageModal(false);
            handleBuyPackage(preSelectedPackage);
        }}
        onBuyAndBook={() => {
            setShowPackageModal(false);
            // Guardar intención de reservar después de comprar
            sessionStorage.setItem('buyAndBookPackage', JSON.stringify({
                packageId: preSelectedPackage._id,
                packageName: preSelectedPackage.name
            }));
            handleBuyPackage(preSelectedPackage);
        }}
    />
)}
```

#### E) Modificar handleBuyPackage para manejar "Buy and Book"

```typescript
// Reemplazar líneas 388-394
const handleBuyPackage = (product: Product) => {
    setSelectedProduct(product);
    form.setValue('productId', product._id);
    form.setValue('assetId', undefined);
    
    const buyAndBook = sessionStorage.getItem('buyAndBookPackage');
    
    if (buyAndBook) {
        // Flujo: Comprar + Reservar
        toast.info(`Seleccionaste: ${product.name}. Ahora elige tu horario.`);
        setStep(1);  // ✅ Vuelve a step 1 para seleccionar servicio
    } else {
        // Flujo: Solo comprar
        toast.info(`Seleccionaste: ${product.name}. Procede a comprar.`);
        setStep(3);  // Va directo a datos y checkout
    }
};
```

### 🧪 Testing

**Casos de prueba:**
1. ✅ QR de paquete activo → Modal se abre
2. ✅ QR de paquete inactivo → Error claro
3. ✅ Click "Comprar y Reservar" → Flujo normal (step 1→2→3→4)
4. ✅ Click "Solo Comprar" → Directo a step 3
5. ✅ Click "Ver otros servicios" → Cierra modal, muestra step 1

---

## 🔧 FIX #2: PRIORIZACIÓN DE ASSETS MÚLTIPLES

### 📊 Problema Actual

```typescript
// Línea 222 actual
form.setValue('assetId', compatibleAssets[0]._id);  // Toma el primero sin criterio
```

Si usuario tiene:
- Paquete A: 5 clases, expira en 3 días
- Paquete B: Ilimitado, expira en 30 días
- Paquete C: 2 clases, expira en 60 días

**Selecciona:** El primero en el array (orden arbitrario)

### ✅ Solución Propuesta

**Criterios de priorización:**
1. **Primero:** Paquetes que vencen pronto (< 7 días)
2. **Segundo:** Paquetes limitados (sobre ilimitados)
3. **Tercero:** Por fecha de expiración (más próximo primero)

### 📝 Cambios de Código

```typescript
// Agregar función helper antes de BusinessBookingPage
const prioritizeAssets = (assets: CustomerAsset[]): CustomerAsset[] => {
    const now = new Date();
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    
    return assets.sort((a, b) => {
        // 1. Prioridad: Assets que expiran en menos de 7 días
        const aExpiresSoon = a.expiresAt && (new Date(a.expiresAt).getTime() - now.getTime() < WEEK_MS);
        const bExpiresSoon = b.expiresAt && (new Date(b.expiresAt).getTime() - now.getTime() < WEEK_MS);
        
        if (aExpiresSoon && !bExpiresSoon) return -1;
        if (!aExpiresSoon && bExpiresSoon) return 1;
        
        // 2. Prioridad: Limitados sobre ilimitados (para consumir recursos limitados primero)
        if (!a.isUnlimited && b.isUnlimited) return -1;
        if (a.isUnlimited && !b.isUnlimited) return 1;
        
        // 3. Por fecha de expiración (más próximo primero)
        if (a.expiresAt && b.expiresAt) {
            return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }
        
        // Si uno tiene expiración y otro no, priorizar el que expira
        if (a.expiresAt && !b.expiresAt) return -1;
        if (!a.expiresAt && b.expiresAt) return 1;
        
        return 0;
    });
};
```

#### Aplicar en fetchAssetsForContact

```typescript
// Reemplazar líneas 217-228
if (compatibleAssets.length > 0) {
    const sortedAssets = prioritizeAssets(compatibleAssets);
    const bestAsset = sortedAssets[0];
    
    const currentAssetId = form.getValues('assetId');
    const isCurrentStillValid = sortedAssets.some(a => a._id === currentAssetId);
    
    if (!currentAssetId || !isCurrentStillValid) {
        form.setValue('assetId', bestAsset._id);
        setActiveTab('credits');
        
        // Mensaje más informativo
        const expiresIn = bestAsset.expiresAt 
            ? Math.ceil((new Date(bestAsset.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
            
        const message = expiresIn && expiresIn <= 7
            ? `¡Encontramos tus créditos! Tienes un paquete que expira en ${expiresIn} días.`
            : `¡Encontramos tus créditos! Se han aplicado automáticamente.`;
            
        toast.success(message);
    } else {
        setActiveTab('credits');
    }
}
```

### 🧪 Testing

**Casos:**
1. ✅ 1 asset → Selecciona ese
2. ✅ 2 assets, uno expira en 3 días → Selecciona el que expira pronto
3. ✅ 2 assets, uno limitado y otro ilimitado (ambos vigentes 30 días) → Selecciona limitado
4. ✅ Toast muestra advertencia si expira en <= 7 días

---

## 🔧 FIX #3: GUARD DOBLE SUBMIT

### 📊 Problema Actual

Usuario puede hacer doble click en "Confirmar Reserva":
1. Primera llamada → Crea booking, consume asset
2. Segunda llamada (simultánea) → Intenta crear otro booking, consume asset de nuevo

**Resultado:** 2 bookings, 2 créditos consumidos

### ✅ Solución Propuesta

Agregar estado `isSubmitting` y deshabilitar botón durante proceso.

### 📝 Cambios de Código

#### A) Agregar estado

```typescript
// Línea ~131
const [isSubmitting, setIsSubmitting] = useState(false);
```

#### B) Modificar onSubmit

```typescript
// Reemplazar línea 396 (inicio de onSubmit)
const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
    if (!businessId) return;
    
    // ✅ Guard de doble submit
    if (isSubmitting) {
        console.log('[GUARD] Already submitting, ignoring duplicate request');
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        // ... toda la lógica actual de onSubmit
        
    } catch (error: any) {
        // ... manejo de errores actual
    } finally {
        setIsSubmitting(false);  // ✅ Siempre liberar el lock
    }
};
```

#### C) Deshabilitar botón de submit

```typescript
// Buscar el botón de "Confirmar Reserva" en Step 4 y actualizar:
<Button 
    type="submit" 
    size="lg" 
    disabled={isSubmitting || !form.formState.isValid}
    className="w-full"
>
    {isSubmitting ? (
        <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Procesando...
        </>
    ) : (
        <>
            <Check className="w-4 h-4 mr-2" />
            Confirmar Reserva
        </>
    )}
</Button>
```

### 🧪 Testing

**Casos:**
1. ✅ Click normal → Funciona
2. ✅ Doble click rápido → Solo 1 request se ejecuta
3. ✅ Click mientras procesa → Botón disabled, no pasa nada
4. ✅ Error en submit → isSubmitting vuelve a false, permite retry

---

## 🔧 FIX #4: WEBHOOK IDEMPOTENCIA

### 📊 Problema Actual

Stripe puede enviar mismo evento 2+ veces:
1. Webhook delivery falla → retry
2. Webhook delivery lenta → timeout → retry
3. Stripe bug → duplicado

**Resultado:** Se crean 2 CustomerAssets para la misma compra

### ✅ Solución Propuesta

Agregar `stripeSessionId` único en CustomerAsset schema y validar antes de crear.

### 📝 Cambios de Código

#### A) Actualizar Schema

```typescript
// backend/src/customer-assets/schemas/customer-asset.schema.ts
// Agregar después de línea ~30 (después de productId)

@Prop({ type: String, unique: true, sparse: true })
stripeSessionId?: string;  // ✅ Unique index para idempotencia
```

#### B) Agregar método de validación en Service

```typescript
// backend/src/customer-assets/customer-assets.service.ts
// Agregar nuevo método antes de createFromPurchase

async findByStripeSession(sessionId: string): Promise<CustomerAssetDocument | null> {
    return this.assetModel.findOne({ stripeSessionId: sessionId });
}
```

#### C) Modificar createFromPurchase

```typescript
// Reemplazar método completo (líneas 14-35)
async createFromPurchase(
    businessId: string, 
    clientEmail: string, 
    productId: string, 
    clientPhone?: string,
    stripeSessionId?: string  // ✅ Nuevo parámetro
) {
    // ✅ Idempotencia check
    if (stripeSessionId) {
        const existing = await this.findByStripeSession(stripeSessionId);
        if (existing) {
            console.log(`[IDEMPOTENCIA] Asset already created for session ${stripeSessionId}`);
            return existing;
        }
    }
    
    const product = await this.productModel.findById(productId);
    if (!product) throw new BadRequestException('Product not found');

    const expiresAt = product.validityDays
        ? new Date(Date.now() + product.validityDays * 24 * 60 * 60 * 1000)
        : undefined;

    const asset = new this.assetModel({
        businessId,
        clientEmail,
        clientPhone,
        productId: new Types.ObjectId(productId),
        totalUses: product.isUnlimited ? 0 : (product.totalUses || 1),
        remainingUses: product.isUnlimited ? 0 : (product.totalUses || 1),
        isUnlimited: product.isUnlimited || false,
        expiresAt,
        status: AssetStatus.Active,
        stripeSessionId,  // ✅ Guardar sessionId
    });

    return asset.save();
}
```

#### D) Actualizar llamadas en StripeService

```typescript
// backend/src/stripe/stripe.service.ts
// Buscar handleProductPaymentCompleted (línea ~649)
// Reemplazar llamada a createFromPurchase:

await this.customerAssetsService.createFromPurchase(
    businessId, 
    clientEmail, 
    productId, 
    clientPhone,
    session.id  // ✅ Pasar sessionId
);
```

#### E) Crear migración (opcional)

```typescript
// backend/src/scripts/add-stripe-session-index.ts
import { connect } from 'mongoose';
import { CustomerAsset } from '../customer-assets/schemas/customer-asset.schema';

async function migrate() {
    await connect(process.env.MONGODB_URI || '');
    
    // Crear índice único sparse (permite null, pero no duplicados)
    await CustomerAsset.collection.createIndex(
        { stripeSessionId: 1 }, 
        { unique: true, sparse: true }
    );
    
    console.log('✅ Index created: stripeSessionId');
    process.exit(0);
}

migrate();
```

### 🧪 Testing

**Casos:**
1. ✅ Primera compra → Crea asset con sessionId
2. ✅ Webhook duplicado → No crea asset, devuelve el existente
3. ✅ Compra sin sessionId (retrocompatibilidad) → Funciona normal
4. ✅ Intentar crear 2 assets con mismo sessionId manualmente → Error de DB

---

## 🔧 FIX #5: AUTO-BOOKING POST-COMPRA DE PAQUETE

### 📊 Problema Actual

**Flujo "Comprar Paquete + Reservar":**
1. Usuario compra paquete en Stripe
2. Vuelve a la página → URL con params de booking
3. Frontend pre-llena formulario
4. Usuario debe hacer click **otra vez** en "Confirmar"

**Usuario piensa:** "Ya pagué, ¿por qué tengo que confirmar de nuevo?"

### ✅ Solución Propuesta

**Nuevo flujo:**
1. Usuario selecciona "Comprar y Reservar"
2. Frontend incluye `bookingData` en successUrl
3. Webhook de Stripe:
   - Crea CustomerAsset
   - **Crea Booking automáticamente**
4. Frontend redirige a página de éxito con código de reserva

### 📝 Cambios de Código

#### A) Modificar onSubmit para incluir bookingData en metadata

```typescript
// En BusinessBookingPage.tsx, dentro de onSubmit
// Reemplazar sección de createProductCheckout (líneas ~437-453)

if (values.productId && !values.assetId) {
    // El usuario está comprando un paquete
    
    // Verificar si quiere reservar inmediatamente
    const buyAndBookIntent = sessionStorage.getItem('buyAndBookPackage');
    let successUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=product`;
    
    if (buyAndBookIntent && values.serviceId && values.date && values.time) {
        // Preparar datos de booking para auto-creación en webhook
        const [hours, minutes] = values.time.split(":").map(Number);
        const scheduledDate = new Date(values.date);
        scheduledDate.setHours(hours, minutes, 0, 0);
        
        const bookingMetadata = {
            serviceId: values.serviceId,
            scheduledAt: scheduledDate.toISOString(),
            clientName: values.clientName,
            clientEmail: values.clientEmail,
            clientPhone: values.clientPhone,
            businessId: businessId!,
            notes: "Reserva automática post-compra de paquete",
            resourceId: selectedResourceId || undefined,
        };
        
        // Cambiar success URL para mostrar confirmación de reserva
        successUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=product-with-booking`;
    }
    
    const checkout = await createProductCheckout({
        productId: values.productId,
        businessId: businessId!,
        clientEmail: values.clientEmail,
        clientPhone: values.clientPhone,
        clientName: values.clientName,
        successUrl,
        cancelUrl: window.location.href,
        bookingData: buyAndBookIntent ? bookingMetadata : undefined,  // ✅ Incluir en metadata
    });

    if (checkout.url) {
        // Limpiar sessionStorage
        sessionStorage.removeItem('buyAndBookPackage');
        window.location.href = checkout.url;
        return;
    }
}
```

#### B) Actualizar API de createProductCheckout

```typescript
// frontend/src/api/productsApi.ts
// Agregar bookingData opcional al tipo

export const createProductCheckout = async (params: {
    productId: string;
    businessId: string;
    clientEmail: string;
    clientPhone?: string;
    clientName?: string;
    successUrl?: string;
    cancelUrl?: string;
    bookingData?: any;  // ✅ Nuevo campo
}) => {
    const { data } = await api.post('/products/checkout', params);
    return data;
};
```

#### C) Backend - Incluir bookingData en Stripe metadata

```typescript
// backend/src/stripe/stripe.service.ts
// Modificar createProductCheckout (líneas ~597-647)

async createProductCheckout(params: {
    productId: string;
    businessId: string;
    clientEmail: string;
    clientPhone?: string;
    clientName?: string;
    successUrl?: string;
    cancelUrl?: string;
    bookingData?: any;  // ✅ Nuevo
}): Promise<{ sessionId: string; url: string }> {
    const { 
        productId, 
        businessId, 
        clientEmail, 
        clientPhone, 
        clientName, 
        successUrl, 
        cancelUrl,
        bookingData  // ✅ Desestructurar
    } = params;
    
    // ... código existente hasta session creation
    
    const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: product.name,
                    description: product.description || undefined,
                },
                unit_amount: Math.round(product.price * 100),
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: successUrl || `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=product`,
        cancel_url: cancelUrl || `${this.frontendUrl}/business/${businessId}/booking`,
        customer_email: clientEmail,
        metadata: {
            type: 'product_purchase',
            productId,
            businessId,
            clientEmail,
            clientPhone: clientPhone || '',
            clientName: clientName || '',
            bookingData: bookingData ? JSON.stringify(bookingData) : '',  // ✅ Incluir como string
        },
    });

    return {
        sessionId: session.id,
        url: session.url!,
    };
}
```

#### D) Backend - Webhook auto-crea booking

```typescript
// backend/src/stripe/stripe.service.ts
// Modificar handleProductPaymentCompleted (líneas ~649-673)

async handleProductPaymentCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { 
        productId, 
        businessId, 
        clientEmail, 
        clientPhone, 
        bookingData  // ✅ Extraer
    } = session.metadata;
    
    this.logger.log(`[PRODUCT] Processing payment for product ${productId}`);

    // Crear customer asset
    const asset = await this.customerAssetsService.createFromPurchase(
        businessId, 
        clientEmail, 
        productId, 
        clientPhone,
        session.id
    );

    this.logger.log(`[PRODUCT] Customer asset created: ${asset._id}`);

    // ✅ Si hay bookingData, crear booking automáticamente
    if (bookingData && bookingData !== '') {
        try {
            const parsedBookingData = JSON.parse(bookingData);
            
            this.logger.log(`[AUTO-BOOKING] Creating booking for asset ${asset._id}`);
            
            // Crear booking automáticamente usando el asset recién creado
            const booking = await this.bookingsService.create({
                ...parsedBookingData,
                assetId: asset._id.toString(),
                scheduledAt: new Date(parsedBookingData.scheduledAt),
                status: 'confirmed',
            }, { role: 'public' });
            
            this.logger.log(`[AUTO-BOOKING] Booking created successfully: ${booking._id}`);
            
            // Opcional: Enviar email con confirmación de compra + reserva
            await this.notificationService.sendPackageWithBookingConfirmation({
                clientEmail,
                packageName: asset.productId?.name || 'Paquete',
                bookingCode: booking.accessCode,
                scheduledAt: booking.scheduledAt,
            });
            
        } catch (error) {
            this.logger.error(`[AUTO-BOOKING] Failed to create booking: ${error.message}`, error.stack);
            // No lanzar error - asset ya se creó, booking puede hacerse manualmente
        }
    }
}
```

#### E) Frontend - Página de éxito actualizada

```typescript
// frontend/src/pages/PaymentSuccess.tsx
// Agregar lógica para detectar tipo product-with-booking

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const type = searchParams.get('type');
    const navigate = useNavigate();
    
    if (type === 'product-with-booking') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <CardTitle className="text-center text-2xl">
                            ¡Paquete Comprado y Reserva Confirmada!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground">
                            Tu pago se procesó exitosamente y tu clase ha sido reservada.
                        </p>
                        <p className="text-center font-medium">
                            Recibirás un email con todos los detalles.
                        </p>
                        <Button 
                            className="w-full" 
                            onClick={() => navigate('/')}
                        >
                            Volver al Inicio
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // ... resto del código para otros tipos
};
```

### 🧪 Testing

**Casos:**
1. ✅ Compra paquete solo → Webhook crea asset, NO booking
2. ✅ Compra paquete + reserva → Webhook crea asset **y** booking
3. ✅ Usuario recibe 1 email con ambas confirmaciones
4. ✅ Si falla booking, asset se crea igual (graceful degradation)
5. ✅ Página de éxito muestra mensaje correcto según tipo

---

## 🔧 FIX #6: VALIDACIÓN DE SLOT OCUPADO (BACKEND)

### 📊 Problema Actual

Dos usuarios pueden reservar el mismo horario simultáneamente:
1. Usuario A consulta slots → Ve 10:00 disponible
2. Usuario B consulta slots → Ve 10:00 disponible
3. Usuario A confirma 10:00 → Booking creado
4. Usuario B confirma 10:00 → **También se crea** (race condition)

### ✅ Solución Propuesta

Validar en backend, al momento de crear booking, que el slot no esté ocupado.

### 📝 Cambios de Código

#### A) Agregar validación en bookings.service.ts

```typescript
// backend/src/bookings/bookings.service.ts
// Agregar DESPUÉS de validación de servicio activo (línea ~139)
// ANTES de validación de requireProduct (línea ~142)

// ✅ Validación de slot disponible (prevenir doble reserva del mismo horario)
const slotOccupied = await this.bookingModel.findOne({
    businessId: payload.businessId,
    serviceId: payload.serviceId,
    scheduledAt: payload.scheduledAt,
    status: { $ne: BookingStatus.Cancelled },
}).lean();

if (slotOccupied) {
    throw new ConflictException({
        message: 'Este horario ya no está disponible. Por favor elige otro.',
        code: 'SLOT_UNAVAILABLE',
    });
}
```

#### B) Agregar manejo de error en frontend

```typescript
// BusinessBookingPage.tsx
// En catch de onSubmit (después de BOOKING_ALREADY_EXISTS)

catch (error: any) {
    const errData = error?.response?.data;
    
    if (errData?.code === "BOOKING_ALREADY_EXISTS") {
        // ... código existente
        return;
    }
    
    // ✅ Nuevo manejo
    if (errData?.code === "SLOT_UNAVAILABLE") {
        toast.error("Este horario acaba de ser reservado por otro usuario. Por favor elige otro horario.", {
            duration: 5000,
        });
        setStep(2);  // Volver a selección de horario
        return;
    }
    
    toast.error(errData?.message || t('booking.form.toasts.error_desc'));
}
```

#### C) Refresh de slots post-error

```typescript
// Agregar en BusinessBookingPage (después de setStep(2) del error)
// Para forzar re-fetch de slots

setStep(2);
form.setValue('time', '');  // Limpiar horario seleccionado
// useSlots se re-ejecutará automáticamente al cambiar selectedServiceId/selectedDate
```

### 🧪 Testing

**Casos:**
1. ✅ Usuario A reserva 10:00 → Success
2. ✅ Usuario B intenta reservar mismo 10:00 **después** → Error claro
3. ⚠️ **CRÍTICO:** Usuario A y B confirman 10:00 **simultáneamente** → Solo 1 se crea, el otro recibe error
4. ✅ Tras error, slots se refrescan y 10:00 ya no aparece disponible

**Testing de Race Condition:**
```bash
# Script de prueba con 2 requests simultáneos
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"businessId":"X","serviceId":"Y","scheduledAt":"2025-12-21T10:00:00.000Z",...}' &

curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"businessId":"X","serviceId":"Y","scheduledAt":"2025-12-21T10:00:00.000Z",...}' &

# Verificar que solo 1 booking se creó en DB
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Día 1: Fixes de Infraestructura
1. **Fix #4 (Webhook Idempotencia)** - Base crítica
2. **Fix #3 (Doble Submit)** - Prevención rápida
3. **Fix #6 (Slot Ocupado)** - Validación backend

**Checkpoint:** Ejecutar migration de índice, testing de race conditions

### Día 2: Fixes de Flujo
4. **Fix #2 (Priorización Assets)** - Lógica simple
5. **Fix #1 (QR → Paquete)** - Nueva UX

**Checkpoint:** Testing de todos los flujos QR

### Día 3: Automatización
6. **Fix #5 (Auto-Booking)** - Integración completa

**Checkpoint:** Testing end-to-end de compra+reserva

### Día 4: Testing Completo
- Test los 20 casos de uso del documento de auditoría
- Pruebas de stress (race conditions)
- Validación de emails
- Testing mobile

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de dar por completado, verificar:

### Fix #1: QR → Paquete
- [ ] Modal se abre al escanear QR de paquete
- [ ] "Comprar y Reservar" lleva al flujo normal (steps 1→4)
- [ ] "Solo Comprar" lleva a step 3 directo
- [ ] Paquetes inactivos muestran error

### Fix #2: Priorización Assets
- [ ] Assets que expiran pronto se seleccionan primero
- [ ] Toast muestra advertencia de expiración
- [ ] Limitados se priorizan sobre ilimitados

### Fix #3: Doble Submit
- [ ] Botón se deshabilita al hacer submit
- [ ] Doble click no crea 2 bookings
- [ ] isSubmitting vuelve a false tras error

### Fix #4: Webhook Idempotencia
- [ ] Índice único creado en BD
- [ ] Webhook duplicado no crea asset duplicado
- [ ] Logs muestran "Already created"

### Fix #5: Auto-Booking
- [ ] Compra paquete + reserva → ambos se crean
- [ ] Email de confirmación incluye ambos datos
- [ ] Página de éxito muestra mensaje correcto

### Fix #6: Slot Ocupado
- [ ] 2 usuarios no pueden reservar mismo horario
- [ ] Error SLOT_UNAVAILABLE aparece en frontend
- [ ] Slots se refrescan tras error

---

## 🚀 DEPLOYMENT

### Pre-deploy Checklist
- [ ] Todos los tests pasan
- [ ] Migration de DB ejecutada en staging
- [ ] Webhooks configurados en Stripe (si cambiaron URLs)
- [ ] Variables de entorno verificadas
- [ ] Rollback plan documentado

### Comandos de Deploy

```bash
# 1. Backend
cd backend
npm run build
npm run migrate:run  # Ejecutar migration de stripeSessionId index
pm2 restart bookpro-api

# 2. Frontend
cd frontend
npm run build
# Deploy según método (Vercel/Netlify/etc)

# 3. Verificar
curl https://api.bookpro.com/health
curl https://app.bookpro.com  # Verificar que carga
```

---

## 📞 SOPORTE POST-DEPLOYMENT

### Monitoreo
- [ ] Logs de Stripe webhooks (Stripe Dashboard)
- [ ] Logs de servidor (PM2/CloudWatch)
- [ ] Métricas de errores (Sentry si existe)
- [ ] Performance (response times)

### Rollback (si falla)
```bash
# Backend
pm2 restart bookpro-api --update-env
git reset --hard HEAD~1
npm run build
pm2 restart bookpro-api

# Frontend
# Revert al deployment anterior en Vercel/Netlify dashboard
```

---

**Documento creado:** 2025-12-20  
**Autor:** Antigravity AI  
**Estimado:** 3-4 días  
**Prioridad:** CRÍTICO (P0)
