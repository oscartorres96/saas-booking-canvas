# Manual de Uso para Dueños de Negocio - BookPro

Bienvenido a **BookPro**, la solución integral para gestionar las citas y reservas de tu negocio de manera eficiente y profesional. Este manual te guiará a través de las funcionalidades clave, tanto para ti como administrador, como para tus clientes.

## 1. Introducción
BookPro permite a tus clientes reservar citas contigo en línea, mientras tú mantienes el control total de tu agenda desde un panel de administración centralizado.

---

## 2. Para el Dueño del Negocio (Administrador)

### Acceso al Panel de Control
1. Ingresa a la URL de tu panel de administración (ej. `http://localhost:5173/admin`).
2. Inicia sesión con tus credenciales de administrador (correo y contraseña).

### Gestión de Reservas
En el **Dashboard**, verás un resumen de tus citas:
- **Calendario/Lista**: Visualiza todas las citas programadas.
- **Detalles**: Haz clic en una cita para ver detalles como el nombre del cliente, servicio, y notas.
- **Estado**: Puedes cambiar el estado de una cita (Confirmada, Completada, Cancelada) según sea necesario.

### Configuración de Servicios
Define qué servicios ofreces:
- Crea nuevos servicios con nombre, duración y precio.
- Tus clientes verán estos servicios al momento de reservar.

---

## 3. Para tus Clientes (Cómo reservan)

### Página de Reservas Pública
Tus clientes accederán a tu página pública de reservas (ej. `http://localhost:5173/`).
1. **Selección de Servicio**: El cliente elige el servicio que desea.
2. **Selección de Fecha y Hora**: Elige un horario disponible en tu calendario.
3. **Datos Personales**: Ingresa su nombre, correo y teléfono.
4. **Confirmación**: Al confirmar, el sistema genera una reserva y le muestra un **Código de Acceso**.

> **IMPORTANTE**: Tus clientes deben guardar este Código de Acceso para gestionar su cita posteriormente.

---

## 4. Gestión de Citas por el Cliente ("Mis Reservas")

Tus clientes pueden consultar y cancelar sus propias citas sin necesidad de llamarte.

### Acceso a "Mis Reservas"
1. El cliente ingresa a la sección "Mis Reservas" (ej. `http://localhost:5173/my-bookings`).
2. **Búsqueda**: Debe ingresar:
   - Su **Correo Electrónico** (el mismo que usó al reservar).
   - Su **Código de Acceso** (proporcionado al confirmar la reserva).
3. **Resultados**: Verá una lista de sus citas futuras y pasadas.

### Cancelación de Citas
Si un cliente necesita cancelar:
1. Busca su reserva en la sección "Mis Reservas".
2. En la tarjeta de la cita, hace clic en el botón **"Cancelar reserva"**.
3. Confirma la acción.
4. La cita se marcará como "Cancelada" inmediatamente en tu sistema y el horario quedará libre nuevamente (dependiendo de tu configuración).

---

## 5. Preguntas Frecuentes

**¿Qué pasa si un cliente pierde su código de acceso?**
Como administrador, puedes buscar la reserva en tu panel y proporcionarle el código, o gestionar la cita por él.

**¿Recibo notificaciones de nuevas reservas?**
Revisa tu panel de administración regularmente para ver las nuevas solicitudes en estado "Pendiente".

---
*BookPro - Simplificando tu agenda.*
