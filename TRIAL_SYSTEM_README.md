# 🎯 Sistema de Trial de 14 Días - Implementación Completa

## 📋 Descripción

Sistema completo para gestionar períodos de prueba (trial) de 14 días para negocios existentes y nuevos, con redirección automática a compra cuando el trial expire.

## ✅ Lo Implementado

### **Backend**

1. **Campo `trialEndsAt` en Business Schema**
   - Tipo: `Date`
   - Ubicación: `backend/src/businesses/schemas/business.schema.ts`
   - Permite establecer manualmente cuándo termina el trial

2. **Verificación Automática en Login**
   - Archivo: `backend/src/auth/auth.service.ts`
   - Al hacer login, verifica si `trialEndsAt` expiró
   - Devuelve `trialExpired: true` si expiró y `subscriptionStatus === 'trial'`
   - Incluye `trialEndsAt` en la respuesta para mostrar al usuario

3. **Script de Migración**
   - Archivo: `backend/src/scripts/set-trial-periods.ts`
   - Asigna 14 días de trial a todos los negocios existentes
   - Solo afecta negocios sin `trialEndsAt`
   - Establece `subscriptionStatus` a 'trial'

### **Frontend**

1. **Verificación en Login**
   - Archivo: `frontend/src/pages/Login.tsx`
   - Detecta `trialExpired === true`
   - Muestra toast de error
   - Redirige automáticamente a `/#pricing`

2. **Tipos Actualizados**
   - `AuthUser` incluye `trialExpired` y `trialEndsAt`
   - `AuthResponse` incluye campos de trial
   - Todo tipado correctamente

3. **Traducciones**
   - Español: "Tu período de prueba ha expirado. Por favor suscríbete para continuar usando BookPro."
   - Inglés: "Your trial period has expired. Please subscribe to continue using BookPro."

## 🚀 Cómo Usar

### **Paso 1: Ejecutar el Script de Migración**

```bash
cd backend
npx ts-node src/scripts/set-trial-periods.ts
```

Esto:
- ✅ Encuentra todos los negocios sin `trialEndsAt`
- ✅ Les asigna 14 días desde HOY
- ✅ Los marca como `subscriptionStatus: 'trial'`
- ✅ Muestra un resumen de lo que hizo

**Ejemplo de salida:**
```
🔍 Finding businesses without trial dates...
📊 Found 5 businesses without trial dates

📅 Setting trial end date to: 30/12/2024
⏳ Processing...

✅ Mi Barbería - Trial until 30/12/2024
✅ Salón de Belleza - Trial until 30/12/2024
...

📊 Migration Summary:
✅ Updated: 5 businesses
📅 Trial end date: 2024-12-30T00:00:00.000Z
```

### **Paso 2: Verificar en MongoDB (Opcional)**

```javascript
// Ver negocios con trial
db.businesses.find({ trialEndsAt: { $exists: true } })

// Ver cuándo expira el trial de un negocio específico
db.businesses.findOne({ _id: ObjectId("TU_BUSINESS_ID") }, { trialEndsAt: 1, subscriptionStatus: 1 })
```

### **Paso 3: Probar el Flujo**

1. **Login con un negocio que tiene trial activo:**
   - ✅ Ingresa normalmente
   - ✅ Ve el dashboard

2. **Login con un negocio con trial expirado:**
   - ❌ No puede ingresar
   - 🔔 Ve toast: "Tu período de prueba ha expirado..."
   - 🔄 Redirige automáticamente a `/#pricing`

## 📊 Gestión Manual de Trials

### **Opción 1: MongoDB Compass (GUI)**

1. Abre MongoDB Compass
2. Conecta a tu BD
3. Ve a collection `businesses`
4. Encuentra el negocio
5. Edita el campo `trialEndsAt`:
   ```json
   {
     "trialEndsAt": { "$date": "2025-01-15T00:00:00.000Z" }
   }
   ```
6. Guarda

### **Opción 2: MongoDB Shell (CLI)**

```javascript
// Extender trial 30 días más
db.businesses.updateOne(
  { _id: ObjectId("TU_BUSINESS_ID") },
  { 
    $set: { 
      trialEndsAt: new Date("2025-01-30"),
      subscriptionStatus: "trial"
    } 
  }
)

// Ver resultado
db.businesses.findOne({ _id: ObjectId("TU_BUSINESS_ID") })
```

### **Opción 3: API/Admin Panel (Futuro)**

Puedes crear un endpoint o panel admin para:
- Ver lista de trials activos
- Extender trials
- Convertir trial a suscripción activa

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────┐
│  Usuario intenta hacer login                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Backend verifica:                          │
│  - ¿Existe trialEndsAt?                     │
│  - ¿Es fecha > hoy?                         │
│  - ¿subscriptionStatus === 'trial'?         │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    SÍ EXPIRÓ            NO EXPIRÓ
         │                   │
         ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ trialExpired:    │  │ trialExpired:    │
│ true             │  │ false/undefined  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Frontend:       │  │  Frontend:       │
│  - Toast error   │  │  - Login success │
│  - navigate(     │  │  - Al dashboard  │
│    '/#pricing')  │  │                  │
└──────────────────┘  └──────────────────┘
```

## 📝 Ejemplos de Casos de Uso

### **Caso 1: Negocio Nuevo (Trial de 14 días)**

1. Admin crea el negocio manualmente
2. Ejecuta el script de migración
3. El negocio tiene 14 días de trial
4. Puede usar el sistema normalmente
5. Día 15: Al hacer login ve mensaje y es redirigido a compra

### **Caso 2: Extender Trial**

```javascript
// MongoDB Shell
db.businesses.updateOne(
  { email: "negocio@ejemplo.com" },
  { 
    $set: { 
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
    } 
  }
)
```

### **Caso 3: Convertir a Suscripción Activa**

```javascript
// MongoDB Shell
db.businesses.updateOne(
  { email: "negocio@ejemplo.com" },
  { 
    $set: { 
      subscriptionStatus: "active",
      trialEndsAt: null // O dejarlo como está para referencia
    } 
  }
)
```

## 🎨 Mensajes al Usuario

### **Es español:**
```
❌ Tu período de prueba ha expirado. 
   Por favor suscríbete para continuar usando BookPro.
```

### **En inglés:**
```
❌ Your trial period has expired. 
   Please subscribe to continue using BookPro.
```

## 🔍 Debugging

### **Ver qué pasa al hacer login:**

**Backend logs:**
```typescript
console.log('Trial check:', {
  trialEndsAt: business.trialEndsAt,
  now: new Date(),
  expired: now > business.trialEndsAt,
  status: business.subscriptionStatus
});
```

**Frontend console:**
```javascript
console.log('User:', loggedUser);
// Ver: trialExpired, trialEndsAt
```

### **Queries útiles:**

```javascript
// Negocios con trial activo
db.businesses.find({ 
  subscriptionStatus: "trial",
  trialEndsAt: { $gt: new Date() }
})

// Trials expirados
db.businesses.find({ 
  subscriptionStatus: "trial",
  trialEndsAt: { $lt: new Date() }
})

// Trials que expiran pronto (próximos 3 días)
const threeDaysFromNow = new Date();
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

db.businesses.find({ 
  subscriptionStatus: "trial",
  trialEndsAt: { 
    $gt: new Date(),
    $lt: threeDaysFromNow
  }
})
```

## ⚠️ Importante

1. **El script es idempotente**: Puedes ejecutarlo múltiples veces sin problemas
2. **No afecta negocios con suscripción activa**: Solo afecta `subscriptionStatus: 'trial'`
3. **Manual override**: Siempre puedes editar `trialEndsAt` manualmente en MongoDB
4. **Zona horaria**: Las fechas se guardan en UTC en MongoDB

## 🚧 Próximas Mejoras

- [ ] Panel Admin para gestionar trials
- [ ] Notificaciones por email cuando el trial está por expirar (ej: 3 días antes)
- [ ] Dashboard que muestre días restantes de trial
- [ ] Endpoint API para extender trials
- [ ] Métricas de conversión trial → pago

## 📚 Archivos Modificados

**Backend:**
- `backend/src/businesses/schemas/business.schema.ts` - Campo trialEndsAt
- `backend/src/auth/auth.service.ts` - Verificación de trial
- `backend/src/scripts/set-trial-periods.ts` - Script de migración

**Frontend:**
- `frontend/src/pages/Login.tsx` - Redirección si trial expiró
- `frontend/src/auth/AuthContext.tsx` - Tipos con trial
- `frontend/src/api/authApi.ts` - AuthResponse con trial
- `frontend/src/locales/es.json` - Traducciones ES
- `frontend/src/locales/en.json` - Traducciones EN

## 🎉 Resultado

Ahora tienes un sistema completo de trial que:
- ✅ Asigna 14 días automáticamente
- ✅ Verifica en cada login
- ✅ Redirige a compra si expiró
- ✅ Permite gestión manual
- ✅ Está completamente traducido
- ✅ Tiene mensajes claros para el usuario
