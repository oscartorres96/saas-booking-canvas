# Configuración de Rutas Multi-Tenant

## Cambios Realizados

Se ha actualizado la aplicación para soportar rutas dinámicas basadas en el slug del negocio. Ahora cada negocio tiene su propia URL.

### Estructura de Rutas

- **`/`** - Página de inicio que redirige automáticamente a `/dentista`
- **`/:businessSlug`** - Página de reservas del negocio (ej: `/dentista`, `/barberia`, etc.)
- **`/login`** - Página de login
- **`/admin`** - Panel de administración
- **`/dashboard`** - Dashboard del negocio

### Archivos Modificados

1. **`src/App.tsx`** - Actualizado con nuevas rutas dinámicas
2. **`src/hooks/useBusinessData.ts`** - Ahora acepta un `businessSlug` opcional
3. **`src/pages/Home.tsx`** - Nueva página de inicio (redirige a `/dentista`)
4. **`src/pages/BookingPage.tsx`** - Nueva página que reemplaza `Index.tsx` con soporte para slug
5. **`server/models/Business.js`** - Agregado campo `slug` único y requerido
6. **`server/index.js`** - Nuevo endpoint `GET /api/business/:slug`
7. **`server/migrate-slugs.js`** - Script de migración para agregar slugs a negocios existentes

### Configuración Requerida

#### 1. Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority
VITE_API_URL=http://localhost:5000/api
PORT=5000
```

Reemplaza `<username>`, `<password>`, y el nombre de la base de datos con tus credenciales de MongoDB.

#### 2. Ejecutar Migración de Slugs

Una vez configurado el archivo `.env`, ejecuta el script de migración para agregar slugs a los negocios existentes:

```bash
npm run migrate-slugs
```

Este script:
- Conecta a MongoDB
- Busca todos los negocios sin campo `slug`
- Genera un slug basado en el nombre del negocio
- Maneja duplicados agregando un sufijo numérico si es necesario

#### 3. Reiniciar el Servidor

Después de ejecutar la migración, reinicia el servidor backend:

```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npm run server
```

### Ejemplo de Uso

Para acceder a la página de reservas del dentista:
```
http://localhost:8080/dentista
```

Para acceder a otro negocio (por ejemplo, una barbería):
```
http://localhost:8080/barberia
```

### Crear Nuevos Negocios

Al crear un nuevo negocio en la base de datos, asegúrate de incluir el campo `slug`:

```javascript
{
  "businessName": "Mi Barbería",
  "slug": "mi-barberia",  // URL-friendly, único
  "type": "barber",
  // ... otros campos
}
```

### Notas Importantes

- El slug debe ser único para cada negocio
- El slug debe ser URL-friendly (solo letras minúsculas, números y guiones)
- Si no existe un negocio con el slug solicitado, se mostrará un error 404
- La página de inicio (`/`) redirige automáticamente a `/dentista` por defecto
