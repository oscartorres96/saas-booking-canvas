# ✅ Checklist de Testing - Mejoras UX Flujo de Reservas

## 🎯 Objetivo
Verificar que todas las mejoras UX funcionan correctamente y mejoran la experiencia del usuario.

---

## 📋 Pre-requisitos

### Datos de Prueba Necesarios
- [ ] Negocio con servicios configurados
- [ ] Al menos 1 servicio con `requireProduct: false` (reserva directa)
- [ ] Al menos 1 servicio con `requireProduct: true` (requiere paquete)
- [ ] Al menos 2 productos activos (1 pase, 1 paquete)
- [ ] Email de prueba con paquete activo
- [ ] Email de prueba sin paquetes

---

## 🧪 Casos de Prueba

### 1. Sección de Productos (ProductsStore)

#### Test 1.1: Visualización de Productos
- [ ] Los productos se muestran en tarjetas
- [ ] Título: "Pases y Paquetes"
- [ ] Subtítulo: "Ahorra comprando paquetes..."
- [ ] Badge "MÁS VENDIDO" aparece en paquetes
- [ ] Precio se muestra correctamente con "MXN"
- [ ] Características se muestran con checkmarks verdes
- [ ] Botón "Comprar Ahora" es visible

#### Test 1.2: Diálogo de Compra
- [ ] Al hacer clic en "Comprar Ahora" se abre el diálogo
- [ ] Título: "Completar Compra"
- [ ] Muestra el nombre del producto seleccionado
- [ ] Campos de nombre y email funcionan
- [ ] Hint del email se muestra correctamente
- [ ] Botón "Proceder al Pago" funciona
- [ ] Muestra "Cargando..." durante el proceso

---

### 2. Detección de Email (Feedback Inmediato)

#### Test 2.1: Email CON Paquete Activo
**Setup**: Usar email que tiene paquete activo

- [ ] Ingresar email válido
- [ ] Sistema detecta automáticamente el paquete
- [ ] Aparece mensaje: "¡Vemos que tienes un paquete activo!"
- [ ] Subtítulo: "Selecciona el paquete que deseas usar..."
- [ ] Se muestra el/los paquete(s) disponible(s)
- [ ] Cada paquete muestra:
  - [ ] Nombre del paquete
  - [ ] Badge con usos restantes (ej. "3 usos")
  - [ ] Fecha de vencimiento
- [ ] El paquete está preseleccionado automáticamente

#### Test 2.2: Email SIN Paquete (Servicio lo Requiere)
**Setup**: Usar email sin paquetes + servicio con `requireProduct: true`

- [ ] Ingresar email válido sin paquetes
- [ ] Aparece mensaje en ámbar/amarillo
- [ ] Título: "Este servicio requiere un pase o paquete activo"
- [ ] Mensaje: "No hemos encontrado un paquete activo..."
- [ ] Icono de paquete visible
- [ ] Mensaje es claro y guía al usuario

#### Test 2.3: Email SIN Paquete (Servicio NO lo Requiere)
**Setup**: Usar email sin paquetes + servicio con `requireProduct: false`

- [ ] Ingresar email válido sin paquetes
- [ ] NO aparece mensaje de error
- [ ] Flujo continúa normalmente
- [ ] Puede reservar sin problemas

---

### 3. Selector de Paquetes (Múltiples Activos)

#### Test 3.1: Preselección Inteligente
**Setup**: Email con 2+ paquetes activos

- [ ] Ingresar email con múltiples paquetes
- [ ] Se muestran todos los paquetes disponibles
- [ ] El paquete más cercano a vencer está preseleccionado
- [ ] Preselección visual clara (borde azul/primary)

#### Test 3.2: Cambio de Paquete
- [ ] Hacer clic en otro paquete
- [ ] Selección cambia visualmente
- [ ] Nuevo paquete queda seleccionado
- [ ] Solo un paquete puede estar seleccionado a la vez

#### Test 3.3: Opción de Pago Individual
**Setup**: Servicio con `requireProduct: false`

- [ ] Opción "Pagar de forma individual" es visible
- [ ] Tiene radio button
- [ ] Al seleccionarla, se deseleccionan los paquetes
- [ ] Puede volver a seleccionar un paquete

#### Test 3.4: Sin Opción Individual
**Setup**: Servicio con `requireProduct: true`

- [ ] Opción "Pagar de forma individual" NO aparece
- [ ] Solo se pueden seleccionar paquetes
- [ ] No se puede continuar sin seleccionar paquete

---

### 4. Validaciones y Errores

#### Test 4.1: Validación de Paquete Requerido
**Setup**: Servicio con `requireProduct: true`, sin paquete seleccionado

- [ ] Intentar confirmar reserva sin paquete
- [ ] Aparece toast de error
- [ ] Título: "Este servicio requiere un pase o paquete activo"
- [ ] Mensaje claro y descriptivo
- [ ] No se crea la reserva

#### Test 4.2: Validación de Campos Vacíos
- [ ] Intentar confirmar sin nombre
- [ ] Toast: "Campos incompletos"
- [ ] Intentar confirmar sin email
- [ ] Toast: "Campos incompletos"
- [ ] Intentar confirmar sin teléfono
- [ ] Toast: "Campos incompletos"

#### Test 4.3: Validación de Fecha/Hora
- [ ] Intentar confirmar sin seleccionar fecha
- [ ] Toast: "Selecciona fecha y hora"
- [ ] Mensaje descriptivo

---

### 5. Confirmaciones

#### Test 5.1: Reserva con Paquete
**Setup**: Reserva usando paquete activo

- [ ] Completar formulario con paquete seleccionado
- [ ] Confirmar reserva
- [ ] Aparece toast de éxito
- [ ] Título: "¡Reserva Confirmada!"
- [ ] Mensaje: "Se ha descontado 1 uso de tu paquete"
- [ ] Redirección a "Mis Reservas"

#### Test 5.2: Reserva Directa (Sin Paquete)
**Setup**: Reserva sin usar paquete

- [ ] Completar formulario sin paquete
- [ ] Confirmar reserva
- [ ] Aparece toast de éxito
- [ ] Título: "¡Reserva Confirmada!"
- [ ] Mensaje: "Tu cita ha sido reservada exitosamente"
- [ ] Redirección correcta

---

### 6. Internacionalización (i18n)

#### Test 6.1: Traducciones en Español
- [ ] Todos los textos están en español
- [ ] No hay textos hardcodeados en inglés
- [ ] Formato de fechas en español
- [ ] Números formateados correctamente

#### Test 6.2: Consistencia de Copys
- [ ] Todos los mensajes son claros y humanos
- [ ] No hay jerga técnica visible
- [ ] Tono es amigable y profesional
- [ ] Copys guían al usuario hacia la solución

---

### 7. Responsive Design

#### Test 7.1: Mobile (< 768px)
- [ ] Productos se muestran en 1 columna
- [ ] Selector de paquetes es usable
- [ ] Formulario se adapta correctamente
- [ ] Botones son fáciles de presionar
- [ ] Textos son legibles

#### Test 7.2: Tablet (768px - 1024px)
- [ ] Productos en 2-3 columnas
- [ ] Layout se adapta bien
- [ ] Espaciado adecuado

#### Test 7.3: Desktop (> 1024px)
- [ ] Productos en 3 columnas
- [ ] Máximo ancho respetado (max-w-5xl)
- [ ] Centrado correcto

---

### 8. Animaciones y Transiciones

#### Test 8.1: Aparición de Mensajes
- [ ] Mensaje de paquete activo aparece con fade-in
- [ ] Mensaje de paquete requerido aparece con fade-in
- [ ] Transiciones son suaves (300ms)

#### Test 8.2: Interacciones
- [ ] Hover en tarjetas de producto
- [ ] Hover en selector de paquetes
- [ ] Cambio de selección es visual
- [ ] Transiciones no causan lag

---

### 9. Flujos Completos End-to-End

#### Test 9.1: Flujo Completo - Compra + Reserva con Paquete
1. [ ] Entrar a página de reservas
2. [ ] Ver productos disponibles
3. [ ] Comprar paquete
4. [ ] Completar pago (Stripe)
5. [ ] Volver a página de reservas
6. [ ] Seleccionar servicio que requiere paquete
7. [ ] Ingresar email usado en compra
8. [ ] Ver paquete detectado automáticamente
9. [ ] Seleccionar fecha/hora
10. [ ] Confirmar reserva
11. [ ] Ver confirmación con descuento de uso
12. [ ] Verificar en "Mis Reservas"

#### Test 9.2: Flujo Completo - Reserva Directa
1. [ ] Entrar a página de reservas
2. [ ] Seleccionar servicio de reserva directa
3. [ ] Ingresar datos personales
4. [ ] Seleccionar fecha/hora
5. [ ] Confirmar reserva
6. [ ] Ver confirmación
7. [ ] Verificar en "Mis Reservas"

#### Test 9.3: Flujo Completo - Cliente con Múltiples Paquetes
1. [ ] Tener email con 2+ paquetes activos
2. [ ] Seleccionar servicio que requiere paquete
3. [ ] Ingresar email
4. [ ] Ver todos los paquetes disponibles
5. [ ] Verificar preselección del más cercano a vencer
6. [ ] Cambiar a otro paquete
7. [ ] Completar reserva
8. [ ] Verificar que se usó el paquete correcto

---

### 10. Edge Cases

#### Test 10.1: Paquete Vencido
**Setup**: Email con paquete vencido

- [ ] Ingresar email con paquete vencido
- [ ] Sistema NO muestra el paquete vencido
- [ ] Mensaje apropiado si servicio requiere paquete

#### Test 10.2: Paquete Sin Usos
**Setup**: Email con paquete sin usos restantes

- [ ] Ingresar email con paquete sin usos
- [ ] Sistema NO muestra el paquete sin usos
- [ ] Mensaje apropiado si servicio requiere paquete

#### Test 10.3: Email Inválido
- [ ] Ingresar email sin @
- [ ] No se dispara búsqueda de paquetes
- [ ] Ingresar email sin dominio
- [ ] No se dispara búsqueda de paquetes

#### Test 10.4: Cambio de Servicio
- [ ] Seleccionar servicio A
- [ ] Ingresar email
- [ ] Ver paquetes para servicio A
- [ ] Cambiar a servicio B
- [ ] Paquetes se actualizan automáticamente

---

## 🐛 Bugs Conocidos a Verificar

- [ ] No hay errores en consola del navegador
- [ ] No hay warnings de React
- [ ] No hay errores de TypeScript
- [ ] No hay memory leaks en useEffect
- [ ] Cleanup de efectos funciona correctamente

---

## 📊 Métricas de Éxito

### Cuantitativas
- [ ] Tiempo promedio de reserva < 2 minutos
- [ ] Tasa de abandono < 20%
- [ ] Tasa de conversión de productos > 15%
- [ ] Errores de usuario < 5%

### Cualitativas
- [ ] Usuarios entienden el flujo sin ayuda
- [ ] Mensajes son claros y útiles
- [ ] No hay confusión sobre paquetes vs reserva directa
- [ ] Feedback es positivo

---

## ✅ Aprobación Final

### Checklist de Aprobación
- [ ] Todos los tests pasaron
- [ ] No hay bugs críticos
- [ ] Performance es aceptable
- [ ] UX es intuitiva
- [ ] Copys son claros
- [ ] Responsive funciona bien
- [ ] i18n está completo

### Firmado por:
- [ ] Product Designer: _______________
- [ ] Frontend Engineer: _______________
- [ ] QA Tester: _______________
- [ ] Product Owner: _______________

---

**Fecha de Testing**: _______________
**Versión Probada**: 1.0
**Estado**: ⏳ Pendiente / ✅ Aprobado / ❌ Rechazado
