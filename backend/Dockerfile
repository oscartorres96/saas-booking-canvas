FROM node:20-slim AS base
WORKDIR /usr/src/app

# Instalar dependencias (sin dev)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar resto del código
COPY . .

# Build de NestJS
RUN npm run build

# Permisos de ejecución para el entrypoint
RUN chmod +x start.sh

ENV NODE_ENV=production
EXPOSE 3000

CMD ["./start.sh"]
