# 🎨 Guía Visual de Copys - Flujo de Reservas BookPro

## 📦 Sección de Productos (Pases y Paquetes)

### Título y Subtítulo
```
Pases y Paquetes
Ahorra comprando paquetes de sesiones o pases únicos para tus clases favoritas
```

### Tarjeta de Producto - Ejemplo
```
┌─────────────────────────────────┐
│  [MÁS VENDIDO]                  │
│                                 │
│  Paquete 4 Clases              │
│  Ahorra con nuestro paquete    │
│                                 │
│  $800 MXN                       │
│                                 │
│  ✓ 4 sesiones incluidas        │
│  ✓ Válido por 30 días          │
│  ✓ Sin cargos ocultos          │
│                                 │
│  [  Comprar Ahora  ]           │
└─────────────────────────────────┘
```

### Diálogo de Compra
```
Completar Compra
Introduce tus datos para comprar Paquete 4 Clases.

Nombre Completo
[Tu nombre                    ]

Correo Electrónico
[ejemplo@correo.com           ]
* Se usará este correo para identificar tus clases al momento de reservar.

[  Proceder al Pago  💳  ]
```

---

## 📧 Detección de Email (Feedback Inmediato)

### ✅ CON Paquete Activo
```
┌─────────────────────────────────────────────┐
│ 📦 ¡Vemos que tienes un paquete activo!    │
│                                             │
│ Selecciona el paquete que deseas usar      │
│ para esta reserva:                          │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Paquete 4 Clases        [3 usos]   │   │
│ │ Vence el 15/03/2025                 │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ ○ Pagar de forma individual         │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### ❌ SIN Paquete (Servicio lo Requiere)
```
┌─────────────────────────────────────────────┐
│ ⚠️  Este servicio requiere un pase o       │
│     paquete activo                          │
│                                             │
│ No hemos encontrado un paquete activo      │
│ bajo este correo. Por favor, adquiere      │
│ uno debajo o usa otro correo electrónico   │
│ para continuar.                             │
└─────────────────────────────────────────────┘
```

---

## 📅 Selector de Paquetes (Múltiples Activos)

### Vista con 2+ Paquetes
```
┌─────────────────────────────────────────────┐
│ 📦 ¡Vemos que tienes un paquete activo!    │
│                                             │
│ Selecciona el paquete que deseas usar:     │
│                                             │
│ ┌─────────────────────────────────────┐   │ ← Preseleccionado
│ │ ✓ Paquete 4 Clases    [2 usos]     │   │   (más cercano a vencer)
│ │   Vence el 15/03/2025               │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │   Paquete 8 Clases    [5 usos]     │   │
│ │   Vence el 30/04/2025               │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ ○ Pagar de forma individual         │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## ✅ Confirmaciones

### Reserva con Paquete
```
┌─────────────────────────────────┐
│          ✓                      │
│                                 │
│  ¡Reserva Confirmada!          │
│                                 │
│  Se ha descontado 1 uso de     │
│  tu paquete                     │
│                                 │
│  Redirigiendo...               │
└─────────────────────────────────┘
```

### Reserva Directa
```
┌─────────────────────────────────┐
│          ✓                      │
│                                 │
│  ¡Reserva Confirmada!          │
│                                 │
│  Tu cita ha sido reservada     │
│  exitosamente                   │
│                                 │
│  Redirigiendo...               │
└─────────────────────────────────┘
```

---

## 🚫 Mensajes de Error (Humanizados)

### Paquete Requerido
```
❌ Este servicio requiere un pase o paquete activo

No hemos encontrado un paquete activo bajo este correo.
Por favor, adquiere uno debajo o usa otro correo
electrónico para continuar.
```

### Paquete Vencido
```
❌ Tu paquete ha vencido

Por favor, adquiere un nuevo paquete para continuar.
```

### Sin Usos Disponibles
```
❌ Tu paquete no tiene usos disponibles

Has agotado los usos de este paquete.
Adquiere uno nuevo para continuar.
```

---

## 🎯 Indicadores de Tipo de Servicio

### Servicio de Reserva Directa
```
ℹ️  Este servicio se reserva directamente
```

### Servicio Requiere Paquete
```
📦 Este servicio requiere un pase o paquete activo
```

---

## 📱 Flujo Completo - Ejemplo Visual

### Paso 1: Selección de Servicio
```
Selecciona un Servicio
┌─────────────────────────────────┐
│ Consulta Nutricional            │
│ 📦 Requiere paquete activo      │
│ 60 min · $500 MXN               │
└─────────────────────────────────┘
```

### Paso 2: Ingreso de Email
```
Email
[cliente@ejemplo.com              ]

↓ (Sistema detecta automáticamente)

┌─────────────────────────────────────────────┐
│ 📦 ¡Vemos que tienes un paquete activo!    │
│ Selecciona el paquete que deseas usar:     │
│                                             │
│ ✓ Paquete 4 Consultas    [3 usos]         │
│   Vence el 15/03/2025                       │
└─────────────────────────────────────────────┘
```

### Paso 3: Selección de Fecha/Hora
```
📅 Selecciona Fecha y Hora

Fecha: 20 de Marzo, 2025
Hora:  10:00 AM
```

### Paso 4: Confirmación
```
Resumen de Reserva
─────────────────────
Servicio:  Consulta Nutricional
Fecha:     20/03/2025
Hora:      10:00 AM
Paquete:   Paquete 4 Consultas (2 usos restantes)

[  Confirmar Reserva  ]
```

### Paso 5: Éxito
```
┌─────────────────────────────────┐
│          ✓                      │
│  ¡Reserva Confirmada!          │
│  Se ha descontado 1 uso de     │
│  tu paquete                     │
└─────────────────────────────────┘
```

---

## 🎨 Paleta de Colores (Estados)

```
✅ Éxito / Activo:     Verde (#22c55e)
📦 Información:        Azul Primary
⚠️  Advertencia:       Ámbar (#f59e0b)
❌ Error:              Rojo (#ef4444)
ℹ️  Neutral:           Gris (#6b7280)
```

---

## 📝 Principios de Copy

### ✅ Hacer
- Usar lenguaje claro y directo
- Ser específico con números (ej. "3 usos", "30 días")
- Guiar al usuario hacia la solución
- Usar emojis con moderación para destacar

### ❌ Evitar
- Jerga técnica ("asset", "product", "entity")
- Mensajes genéricos ("Error", "Algo salió mal")
- Negatividad sin solución
- Sobrecarga de información

---

**Última actualización**: 18 de Diciembre, 2025
**Versión**: 1.0
