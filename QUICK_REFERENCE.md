# ⚡ QUICK REFERENCE - BookPro Production

## 🔑 JWT SECRET (YA GENERADO)
```
355549a0f2565758b24d473fe9e15e8c065600d840df66085821446daebb5e18ffa0269635febab62b4756a41b2a49980d5c2
```

## 📝 TAREAS PENDIENTES (Orden de Prioridad)

### 1. Corregir Errores de Lint (~20 errores)
```bash
cd frontend
npm run lint

# Patrón de corrección:
# ❌ catch (error: any)
# ✅ catch (error: unknown)
#    const errorMessage = error instanceof Error && 'response' in error 
#        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
#        : undefined;
```

### 2. Remover console.log()
```bash
# Buscar
grep -r "console.log" frontend/src backend/src

# Eliminar o comentar todos los console.log()
```

### 3. Configurar Variables de Entorno

**Backend** (`backend/.env`):
```env
MONGODB_URI="mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/bookpro?retryWrites=true&w=majority"
JWT_SECRET="355549a0f2565758b24d473fe9e15e8c065600d840df66085821446daebb5e18ffa0269635febab62b4756a41b2a49980d5c2"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="app-password-de-gmail"
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_URL=https://tu-backend.com/api
```

### 4. Actualizar CORS (backend/src/main.ts)
```typescript
const allowedOrigins = [
    'https://tudominio.com',
    process.env.FRONTEND_URL,
];
```

## 🚀 DEPLOY RÁPIDO

### Docker (Local Testing)
```bash
docker-compose build
docker-compose up -d
```

### Railway (Backend) + Vercel (Frontend)
```bash
# Backend
cd backend
railway up

# Frontend
cd frontend
vercel --prod
```

## ✅ CHECKLIST RÁPIDO
- [ ] Lint errors fixed
- [ ] console.log() removed
- [ ] .env configured (Backend)
- [ ] .env.production configured (Frontend)
- [ ] CORS updated
- [ ] Test local build
- [ ] Deploy
- [ ] Test production

## 📊 ESTADO ACTUAL
- ✅ JWT Generated
- ✅ Builds working
- ✅ Docker configured
- ✅ 7/27 lint errors fixed
- ⚠️ 20 lint errors remaining
- ⚠️ console.log() present

## 🔗 ENLACES ÚTILES
- MongoDB Atlas: https://cloud.mongodb.com
- Gmail App Passwords: https://myaccount.google.com/apppasswords
- Railway: https://railway.app
- Vercel: https://vercel.com

## 📞 EN CASO DE ERROR
```bash
# Ver logs
docker-compose logs -f backend
pm2 logs bookpro-backend  # si usas PM2

# Reiniciar
docker-compose restart
pm2 restart bookpro-backend
```

---
**Documento completo**: `GUIA_DEPLOYMENT_FINAL.md`
