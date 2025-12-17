# ============================================
# BOOKPRO - PRODUCTION ENVIRONMENT VARIABLES
# ============================================
# ⚠️ IMPORTANTE: 
# - Este es un archivo de EJEMPLO
# - Copia este archivo como .env en producción
# - Reemplaza TODOS los valores de ejemplo con tus claves reales
# - NUNCA subas el archivo .env real a Git
# ============================================

# ============================================
# STRIPE LIVE MODE CONFIGURATION
# ============================================
# Obtén estas claves desde: https://dashboard.stripe.com/apikeys
# (Asegúrate de estar en modo LIVE)

# Clave secreta de Stripe (LIVE)
# Comienza con: sk_live_
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE

# Webhook secret para producción (LIVE)
# Obtén desde: Developers → Webhooks → [Tu endpoint] → Signing secret
# Comienza con: whsec_
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE

# ============================================
# STRIPE PRICE IDs (LIVE MODE)
# ============================================
# Crea tus productos en: https://dashboard.stripe.com/products
# Comienzan con: price_

# Plan Mensual ($299 MXN/mes)
STRIPE_PRICE_ID_MONTHLY=price_YOUR_MONTHLY_PRICE_ID_HERE

# Plan Anual ($3,289 MXN/año - equivalente a 11 meses)
STRIPE_PRICE_ID_ANNUAL=price_YOUR_ANNUAL_PRICE_ID_HERE

# Retrocompatibilidad (usa el mismo que MONTHLY)
STRIPE_PRICE_ID=price_YOUR_MONTHLY_PRICE_ID_HERE

# ============================================
# APPLICATION URLs
# ============================================
# URLs de producción (HTTPS requerido)

# URL del frontend (donde corre React/Vite)
FRONTEND_URL=https://app.tudominio.com

# URL del backend (donde corre NestJS)
BACKEND_URL=https://api.tudominio.com

# ============================================
# DATABASE
# ============================================
# MongoDB Atlas o tu servidor de MongoDB en producción

# URI de conexión a MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/bookpro?retryWrites=true&w=majority

# Nombre de la base de datos
DB_NAME=bookpro

# ============================================
# AUTHENTICATION
# ============================================
# Secreto para JWT (debe ser único y complejo)
# Genera uno con: openssl rand -base64 32

JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_HERE_MINIMUM_32_CHARS

# Expiración del token (en segundos)
JWT_EXPIRATION=86400

# ============================================
# EMAIL CONFIGURATION
# ============================================
# Configuración SMTP para envío de emails

# Servidor SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Credenciales SMTP
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-aqui

# Email del remitente
SMTP_FROM=BookPro <noreply@tudominio.com>

# Email del administrador (para notificaciones)
ADMIN_EMAIL=admin@tudominio.com

# ============================================
# APPLICATION SETTINGS
# ============================================

# Entorno de ejecución
NODE_ENV=production

# Puerto del servidor (default: 3000)
PORT=3000

# CORS - Dominios permitidos (separados por coma)
CORS_ORIGIN=https://app.tudominio.com,https://www.tudominio.com

# ============================================
# TRIAL SYSTEM (OPTIONAL)
# ============================================
# Días de prueba gratuita (0 para desactivar)
TRIAL_DAYS=0

# ============================================
# WHATSAPP NOTIFICATIONS (OPTIONAL)
# ============================================
# Si usas notificaciones de WhatsApp

WHATSAPP_API_KEY=your_whatsapp_api_key_if_used
WHATSAPP_PHONE_NUMBER=+521234567890

# ============================================
# MONITORING & LOGGING (OPTIONAL)
# ============================================
# Configuración para servicios de monitoreo

# Sentry para error tracking
SENTRY_DSN=https://your-sentry-dsn-here

# Log level (error, warn, info, debug)
LOG_LEVEL=info

# ============================================
# NOTAS IMPORTANTES
# ============================================
#
# 1. SEGURIDAD:
#    - Nunca compartas estas claves
#    - Usa un gestor de secretos en producción (AWS Secrets, etc.)
#    - Rota las claves regularmente
#
# 2. TESTING:
#    - Prueba SIEMPRE en staging antes de producción
#    - Mantén un .env.staging separado
#
# 3. BACKUPS:
#    - Haz backup de estas variables de forma segura
#    - Documenta dónde se almacenan en producción
#
# 4. DEPLOYMENT:
#    - Configura estas variables en tu servicio de hosting
#    - No las incluyas en el build de la aplicación
#
# ============================================
