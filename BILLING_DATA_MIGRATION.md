# 📊 Manejo de Datos de Facturación para Negocios Existentes

## 🎯 Situación

Tienes negocios creados **antes** de implementar la sección de facturación. Estos negocios no tienen registros de suscripción en la base de datos.

## ✅ Soluciones Disponibles

### **Opción 1: Dejar Como Están (Recomendada)** 👑

**¿Qué hace?**
- Los negocios existentes pueden seguir operando normalmente
- No tienen suscripción asociada
- El componente Billing muestra: "No tienes una suscripción activa"
- Pueden hacer clic en "Ver Planes" para suscribirse si desean

**Ventajas:**
- ✅ No rompes nada
- ✅ No necesitas hacer nada ahora
- ✅ Los usuarios deciden si quieren suscribirse
- ✅ Ya está implementado y funcionando

**Recomendación:** Esta es la mejor opción si quieres que los nuevos usuarios paguen, pero los existentes puedan decidir.

---

### **Opción 2: Migración Automática con Script** 🔧

**¿Qué hace?**
- Ejecutas un script que crea suscripciones "legacy" para todos los negocios
- Los marca como `priceId: "legacy_grandfathered"`
- Les da acceso "activo" hasta 2099 (básicamente ilimitado)
- No les cobra nada

**Cómo usar:**

```bash
# 1. Navega al backend
cd backend

# 2. Ejecuta el script de migración
npx ts-node src/scripts/migrate-subscriptions.ts
```

**El script:**
- ✅ Encuentra todos los negocios sin suscripción
- ✅ Les crea una suscripción "legacy_grandfathered"
- ✅ Los marca como activos hasta 2099
- ✅ Actualiza el `subscriptionStatus` a "active"
- ✅ No sobrescribe suscripciones existentes

**Ventajas:**
- ✅ Todos los negocios tienen suscripción
- ✅ Los marca como "legacy" para referencia futura
- ✅ No les cobra nada
- ✅ Automático y seguro

**Ubicación del script:** `backend/src/scripts/migrate-subscriptions.ts`

---

### **Opción 3: Migración Manual en MongoDB** 📝

**¿Qué hace?**
- Creas manualmente la suscripción en MongoDB Compass o CLI
- Útil si solo tienes uno o pocos negocios

**Guía completa:** Ver `MIGRATION_MANUAL.md`

**Resumen rápido con MongoDB Compass:**

1. Conecta a tu base de datos
2. Ve a collection `businesses` y encuentra tu negocio
3. Copia el `_id` y `ownerUserId`
4. Ve a collection `subscriptions`
5. Inserta este documento (reemplaza los IDs):

```json
{
  "userId": "TU_OWNER_USER_ID",
  "businessId": "TU_BUSINESS_ID",
  "priceId": "legacy_grandfathered",
  "status": "active",
  "currentPeriodStart": { "$date": "2024-01-01T00:00:00.000Z" },
  "currentPeriodEnd": { "$date": "2099-12-31T23:59:59.999Z" }
}
```

6. Actualiza el `subscriptionStatus` del negocio a "active"

---

## 🎨 Cómo Se Ve en la UI

### **Sin Suscripción:**
```
┌─────────────────────────────────┐
│   💳                            │
│   No tienes una suscripción     │
│   activa                        │
│                                 │
│   Suscríbete para continuar     │
│   usando BookPro                │
│                                 │
│   [Ver Planes]                  │
└─────────────────────────────────┘
```

### **Con Suscripción Legacy:**
```
┌─────────────────────────────────┐
│   Resumen de Suscripción    ✅  │
│                                 │
│   Plan Actual                   │
│   Plan Legacy (Grandfathered)   │
│   Incluido / -                  │
│                                 │
│   Próximo Pago: 31 dic 2099     │
└─────────────────────────────────┘
```

---

## 🔍 Identificar Suscripciones Legacy

En el código frontend, las suscripciones legacy se identifican por:

```typescript
priceId === 'legacy_grandfathered' || !priceId
```

El componente Billing ya maneja esto automáticamente y muestra:
- **Nombre:** "Plan Legacy (Grandfathered)"
- **Estado:** Badge verde "Activo"
- **Renovación:** Fecha muy futura (2099)

---

## 📋 Recomendación Final

**Para tu caso específico:**

1. **Corto plazo:** Deja los negocios sin suscripción
   - Ya funciona correctamente
   - No requiere acción inmediata

2. **Si quieres "limpiar" la UI:**
   - Ejecuta el script de migración
   - Todos tendrán suscripción "legacy"
   - Billing mostrará datos completos

3. **Futuro:**
   - Negocios nuevos pagan desde día 1
   - Negocios legacy siguen gratis
   - Puedes migrarlos cuando quieras

## 🚀 Archivos Creados

1. **Script de migración:** `backend/src/scripts/migrate-subscriptions.ts`
2. **Guía manual:** `MIGRATION_MANUAL.md`
3. **Este README:** `BILLING_DATA_MIGRATION.md`

## ⚠️ Importante

- El script es **idempotente** (puedes ejecutarlo múltiples veces sin problemas)
- **No sobrescribe** suscripciones existentes
- **No borra** ningún dato
- Crea un **log** de lo que hace

## 🆘 ¿Necesitas Ayuda?

Si ejecutas el script y algo sale mal:
1. El script hace log de todo lo que hace
2. No borra datos, solo crea
3. Puedes eliminar manualmente las suscripciones creadas si es necesario

```javascript
// Para eliminar suscripciones legacy si es necesario:
db.subscriptions.deleteMany({ priceId: "legacy_grandfathered" })
```
