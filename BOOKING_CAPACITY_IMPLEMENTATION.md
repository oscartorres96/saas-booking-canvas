# 🎯 Implementación: Capacidad de Reservas por Horario

## ✅ Resumen Ejecutivo

Se implementó exitosamente un sistema flexible de **capacidad de reservas por horario** que permite a cada negocio configurar si acepta:
- **Una sola reserva por horario** (modo SINGLE)
- **Múltiples reservas simultáneas** en el mismo horario (modo MULTIPLE)

---

## 🗄️ Cambios en Base de Datos

### `business.schema.ts`
```typescript
@Prop({
  type: {
    mode: { type: String, enum: ['SINGLE', 'MULTIPLE'], default: 'SINGLE' },
    maxBookingsPerSlot: { type: Number, default: null },
  }
})
bookingCapacityConfig?: {
  mode: 'SINGLE' | 'MULTIPLE';
  maxBookingsPerSlot: number | null;
};
```

**Reglas de negocio:**
- Si `mode === 'SINGLE'`: `maxBookingsPerSlot` debe ser `null`
- Si `mode === 'MULTIPLE'`: `maxBookingsPerSlot` debe ser `>= 2`

---

## 🧠 Backend - Lógica de Validación

### `bookings.service.ts`

**Antes:**
```typescript
// Validación simple: 1 reserva = 1 slot ocupado
const slotOccupied = await this.bookingModel.findOne({...});
if (slotOccupied) throw new ConflictException('Horario no disponible');
```

**Después:**
```typescript
// Validación flexible basada en configuración del negocio
const capacityConfig = business.bookingCapacityConfig || { mode: 'SINGLE', maxBookingsPerSlot: null };
const existingBookingsCount = await this.bookingModel.countDocuments({
  businessId, serviceId, scheduledAt, 
  status: { $ne: 'cancelled' }
});

// SINGLE: solo 1 reserva permitida
if (capacityConfig.mode === 'SINGLE' && existingBookingsCount >= 1) {
  throw new ConflictException({
    message: 'Este horario ya no está disponible.',
    code: 'booking.capacity.single_exceeded',
  });
}

// MULTIPLE: N reservas permitidas
if (capacityConfig.mode === 'MULTIPLE' && existingBookingsCount >= capacityConfig.maxBookingsPerSlot) {
  throw new ConflictException({
    message: `Cupo lleno para este horario (${capacityConfig.maxBookingsPerSlot}/${capacityConfig.maxBookingsPerSlot})`,
    code: 'booking.capacity.multiple_exceeded',
    capacity: { current: existingBookingsCount, max: capacityConfig.maxBookingsPerSlot }
  });
}
```

**Errores semánticos:**
- `booking.capacity.single_exceeded` - Cuando se intenta reservar en un slot que ya tiene 1 reserva (modo SINGLE)
- `booking.capacity.multiple_exceeded` - Cuando se alcanza el límite de reservas simultáneas (modo MULTIPLE)

---

## 🧑‍💼 Dashboard - UX de Configuración

### `BusinessSettings.tsx`

**Ubicación:** Tab "Políticas de Reserva" → Nueva sección "Capacidad de Reservas por Horario"

**Componentes agregados:**
1. **Radio Buttons** para seleccionar modo:
   - 🔘 Solo una reserva por horario
   - 🔘 Varias reservas en el mismo horario

2. **Input condicional** (solo visible si modo = MULTIPLE):
   - Campo numérico para `maxBookingsPerSlot`
   - Validación: mínimo 2 reservas
   - Helper text: "Ejemplo: 10 personas en una clase de spinning"

3. **Tooltips explicativos:**
   - SINGLE: "💡 Cada horario solo puede tener 1 cliente" (dentista, nutriólogo)
   - MULTIPLE: "💡 Múltiples clientes pueden reservar el mismo horario" (spinning, yoga)

**Flujo de guardado:**
```typescript
dataToSubmit = {
  bookingCapacityConfig: {
    mode: values.bookingCapacityMode,
    maxBookingsPerSlot: values.bookingCapacityMode === 'MULTIPLE' 
      ? Number(values.maxBookingsPerSlot) || null 
      : null,
  }
};
```

---

## 🌐 Traducciones (es.json)

```json
"settings": {
  "booking": {
    "capacity": {
      "title": "Capacidad de Reservas por Horario",
      "description": "Define cuántas reservas pueden existir al mismo tiempo en un horario",
      "mode_label": "¿Cuántas reservas permites por horario?",
      "single_radio": "Solo una reserva por horario",
      "single_desc": "Recomendado para consultas 1-a-1 (dentista, nutriólogo, consultas privadas)",
      "multiple_radio": "Varias reservas en el mismo horario",
      "multiple_desc": "Ideal para clases grupales, sesiones paralelas o eventos (spinning, yoga, talleres)",
      "max_label": "Número máximo de reservas por horario",
      "max_placeholder": "Ej: 10",
      "max_helper": "Ejemplo: 10 personas en una clase de spinning, 20 en una sesión de yoga",
      "validation_min": "Debes permitir al menos 2 reservas simultáneas",
      "tooltip_single": "Cada horario solo puede tener 1 cliente",
      "tooltip_multiple": "Múltiples clientes pueden reservar el mismo horario"
    }
  }
}
```

---

## 🎨 Casos de Uso

### **Modo SINGLE** (Ultra popular)
- ✅ Dentista (1 paciente a la vez)
- ✅ Nutriólogo (consultas privadas)
- ✅ Consultas médicas
- ✅ Asesorías 1-a-1
- ✅ Cortes de cabello individual

### **Modo MULTIPLE** (Clases grupales)
- ✅ Spinning (10-20 bicicletas disponibles)
- ✅ Yoga (15-30 tapetes)
- ✅ CrossFit (10-15 personas por clase)
- ✅ Talleres (capacidad del espacio)
- ✅ Sesiones grupales

---

## ✅ Checklist de Testing

### Backend
- [x] Schema actualizado en `business.schema.ts`
- [x] Validación de capacidad en `bookings.service.ts`
- [x] Errores semánticos con códigos claros
- [x] Fallback a modo SINGLE si no existe configuración

### Frontend - Dashboard
- [x] Form schema con validación de `maxBookingsPerSlot >= 2`
- [x] Carga correcta de valores desde backend
- [x] Radio buttons funcionales
- [x] Input condicional visible solo en modo MULTIPLE
- [x] Guardado correcto enviando `bookingCapacityConfig`
- [x] Traducciones completas en español

### Flujo de Reservas (Cliente Final)
- [ ] Ocultar horarios llenos cuando se alcanza capacidad
- [ ] Mostrar mensaje "Cupo lleno" en slots no disponibles
- [ ] No permitir seleccionar slots que exceden capacidad

---

## 🔄 Próximos Pasos

### Alta Prioridad
1. **Frontend - Cliente Booking Page**: 
   - Implementar lógica para ocultar/desactivar slots llenos
   - Mostrar contador de disponibilidad: "3/10 lugares disponibles"

### Mejoras Futuras
2. **Capacidad por Servicio**: Permitir configurar capacidad diferente por cada servicio
3. **Capacidad por Recurso**: Vincular capacidad a recursos físicos (bicis, camillas, salas)
4. **Analytics**: Dashboard con métricas de capacidad utilizada vs disponible

---

## 📊 Arquitectura

```
┌─────────────────┐
│  Database       │  ← bookingCapacityConfig: { mode, maxBookingsPerSlot }
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │  ← Validación automática antes de crear reserva
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌────────┐
│Client│  │Dashboard│ ← UX de configuración
└──────┘  └────────┘
```

**Desacoplamiento:** 
- ✅ Configuración independiente por negocio
- ✅ Validación centralizada en backend
- ✅ Extensible a futuros casos de uso

---

## 🎯 Resultado

✅ **Configuración clara y profesional** para el negocio
✅ **Validación automática** aplicada en backend
✅ **UX fluida** lista para implementar en cliente
✅ **Arquitectura escalable** y coherente con BookPro
✅ **Sistema flexible** que respeta las reglas del negocio

---

**Implementado por:** Antigravity AI
**Fecha:** 2025-12-22
**Status:** ✅ Backend Completo | 🟡 Frontend Dashboard Completo | 🔴 Frontend Cliente Pendiente
