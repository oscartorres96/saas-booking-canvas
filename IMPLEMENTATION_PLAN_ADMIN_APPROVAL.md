# Plan de Implementación: Flujo de Demo Request → Admin Approval

## Estado Actual
- ✅ LeadsModule funcional (demo requests)
- ✅ Email de notificación a admin cuando llega demo
- ✅ GetStarted page con opciones trial/pago
- ❌ Registro público abierto en /login
- ❌ Panel de admin para gestionar leads
- ❌ Sistema de activación con token

## Cambios a Implementar

### 1. Frontend - Modificar Flujo de Registro

#### 1.1 PricingSection.tsx
**Actual:** Redirige a /login
**Nuevo:** Abre modal de Demo Request (reutilizar DemoRequestDialog)

#### 1.2 Landing Page - Botón "Comenzar ahora"
**Actual:** Redirige a /login  
**Nuevo:** Abre modal de Demo Request

#### 1.3 Login.tsx
**Actual:** Tabs de Login y Demo
**Nuevo:** Solo tab de Login (sin registro público)
**Nota:** Solo usuarios con cuenta (creada por admin) pueden iniciar sesión

### 2. Backend - Modificar Lead Schema

#### 2.1 lead.schema.ts
Agregar campos:
```typescript
status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending'
}
approvedBy: { type: String } // Admin user ID
approvedAt: { type: Date }
accountCreated: { type: Boolean, default: false }
```

### 3. Backend - Modificar User Schema

#### 3.1 user.schema.ts
Agregar campos:
```typescript
activationToken: { type: String }
activationTokenExpires: { type: Date }
isActive: { type: Boolean, default: false }
createdFromLead: { type: String } // Lead ID reference
```

### 4. Backend - Crear Admin Endpoints

#### 4.1 LeadsController
Nuevos endpoints:
- `GET /api/leads/pending` - Listar leads pendientes
- `POST /api/leads/:id/approve` - Aprobar lead y crear cuenta
  - Body: { accessType: 'trial' | 'paid' }
- `POST /api/leads/:id/reject` - Rechazar lead
  - Body: { reason: string }

#### 4.2 LeadsService
Métodos nuevos:
- `getPendingLeads()` - Filtrar leads con status='pending'
- `approveLead(leadId, accessType, adminId)`:
  1. Verificar que lead existe y está pending
  2. Generar activationToken único
  3. Generar password temporal aleatorio
  4. Crear User con isActive=false
  5. Crear Business con subscriptionStatus según accessType:
     - accessType='trial' → 'trial'
     - accessType='paid' → 'pending_payment'
  6. Actualizar Lead: status='approved', accountCreated=true
  7. Enviar email de invitación con token y password
  8. Retornar datos de la cuenta creada
- `rejectLead(leadId, reason, adminId)`:
  1. Actualizar Lead: status='rejected'
  2. Enviar email de rechazo (opcional/profesional)

### 5. Backend - Sistema de Activación

#### 5.1 AuthController
Nuevo endpoint:
- `POST /api/auth/activate` - Activar cuenta con token
  - Body: { token: string, newPassword: string }
  - Valida token, actualiza password, marca isActive=true
  - Retorna accessToken para auto-login

#### 5.2 AuthService
Método nuevo:
- `activateAccount(token, newPassword)`:
  1. Buscar user con activationToken válido (no expirado)
  2. Validar que no esté ya activo
  3. Hash del newPassword
  4. Actualizar: password, isActive=true, activationToken=null
  5. Generar accessToken y refreshToken
  6. Retornar tokens + user data

### 6. Frontend - Página de Activación

#### 6.1 Activate.tsx (Nueva página)
Ruta: `/activate/:token`

Contenido:
- Input para nueva contraseña
- Confirmar contraseña
- Botón "Activar Cuenta"
- Al completar: auto-login y redirigir a /onboarding

### 7. Frontend - Modificar GetStarted

#### 7.1 GetStarted.tsx
**Actual:** Muestra ambas opciones (trial y pago)

**Nuevo:** Mostrar opciones según business.subscriptionStatus:
```typescript
if (business.subscriptionStatus === 'trial') {
  // Solo mostrar mensaje: "Tu trial está activo"
  // Botón: "Ir al Panel" → /admin
  // NO mostrar opción de pago
}

if (business.subscriptionStatus === 'pending_payment') {
  // Solo mostrar opción de pago
  // NO mostrar opción de trial
  // Mensaje: "Tu cuenta requiere suscripción activa"
}

if (business.subscriptionStatus === 'active') {
  // Ya está pagado
  // Botón: "Ir al Panel" → /admin
}
```

### 8. Backend - Email Templates

#### 8.1 notification.service.ts
Nuevos métodos:
- `sendAccountActivationEmail(user, token, temporaryPassword)`:
  - Subject: "Tu cuenta BookPro está lista - Actívala ahora"
  - Link: `${FRONTEND_URL}/activate/${token}`
  - Incluye password temporal
  - Expira en 48 horas

- `sendLeadRejectionEmail(lead, reason)`:
  - Subject: "Actualización sobre tu solicitud BookPro"
  - Mensaje profesional de rechazo (opcional)

#### 8.2 email-templates.ts
Nuevos templates:
- `accountActivationTemplate`
- `leadRejectionTemplate`

### 9. Frontend - Panel de Admin: Gestión de Leads

#### 9.1 AdminLeadsPanel.tsx (Nuevo componente)
Ubicación: `/admin` (nueva tab/sección)

Contenido:
- Tabla de leads pendientes
- Columnas: Nombre, Email, Empresa, Teléfono, Fecha, Acciones
- Acciones:
  - Botón "Aprobar" → Abre modal
  - Botón "Rechazar" → Abre modal de confirmación

#### 9.2 ApproveLeadModal.tsx (Nuevo componente)
Contenido:
```
┌─────────────────────────────────────────┐
│ Aprobar Lead: {nombre}                 │
├─────────────────────────────────────────┤
│ Empresa: {empresa}                      │
│ Email: {email}                          │
│                                         │
│ ¿Con qué acceso crear la cuenta?       │
│                                         │
│ ( ) Trial 14 días (Gratis)             │
│     El cliente tendrá acceso            │
│     completo por 14 días                │
│                                         │
│ (•) Requiere Pago ($299 MXN/mes)       │
│     El cliente deberá suscribirse       │
│     antes de usar el sistema            │
│                                         │
│ [Cancelar] [Crear Cuenta y Enviar]     │
└─────────────────────────────────────────┘
```

### 10. Validaciones y Seguridad

#### 10.1 Backend
- ✅ Solo admin puede aprobar/rechazar leads
- ✅ Token de activación expira en 48 horas
- ✅ Validar que email del lead no tenga cuenta ya
- ✅ Prevenir activación múltiple del mismo token
- ✅ Log de quién aprobó cada lead (auditoría)

#### 10.2 Frontend
- ✅ Botón "Comenzar ahora" abre demo modal (no /login)
- ✅ /register ruta deshabilitada o redirige a /login
- ✅ GetStarted solo muestra opciones según acceso asignado

---

## Orden de Implementación Sugerido

1. **Backend - Schemas** (Lead, User modificados)
2. **Backend - Leads Endpoints** (approve, reject, list pending)
3. **Backend - Auth Activation** (activate endpoint)
4. **Backend - Email Templates** (activation, rejection)
5. **Frontend - Activate Page** (/activate/:token)
6. **Frontend - Admin Leads Panel** (tabla + modales)
7. **Frontend - Modificar GetStarted** (condicional según status)
8. **Frontend - Modificar Landing/Pricing** (demo modal en vez de /login)
9. **Frontend - Modificar Login** (remover registro público)
10. **Testing End-to-End**

---

## Testing Checklist

- [ ] Demo request desde landing
- [ ] Email recibido por admin
- [ ] Admin aprueba con Trial → Email enviado
- [ ] Cliente activa cuenta con token
- [ ] Cliente completa onboarding
- [ ] Cliente ve dashboard (trial activo, sin opción de pago)
- [ ] Admin aprueba con Paid → Email enviado
- [ ] Cliente activa cuenta
- [ ] Cliente completa onboarding
- [ ] Cliente solo ve opción de pago en GetStarted
- [ ] Cliente paga → Status cambia a 'active'
- [ ] Token expirado muestra error
- [ ] Token ya usado muestra error

---

## Notas Adicionales

- **Password Temporal:** Se puede usar librería como `generate-password` o crypto.randomBytes
- **Token Único:** UUID v4 o crypto.randomBytes(32).toString('hex')
- **Expiración Token:** 48 horas recomendadas
- **Email Design:** Usar mismo template base que demo request
- **Admin Auth:** Asegurar que solo users con role='admin' accedan a leads panel
