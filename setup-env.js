#!/usr/bin/env node

/**
 * Script de configuración para crear el archivo .env
 * Ejecutar con: node setup-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.log('\n🚀 Configuración del archivo .env\n');
    console.log('Este script te ayudará a crear el archivo .env necesario para la aplicación.\n');

    const envPath = path.join(__dirname, '.env');

    // Verificar si ya existe
    if (fs.existsSync(envPath)) {
        const overwrite = await question('⚠️  El archivo .env ya existe. ¿Deseas sobrescribirlo? (s/n): ');
        if (overwrite.toLowerCase() !== 's') {
            console.log('❌ Configuración cancelada.');
            rl.close();
            return;
        }
    }

    console.log('\n📝 Por favor, proporciona la siguiente información:\n');

    const mongoUri = await question('MongoDB URI (ej: mongodb+srv://user:pass@cluster.mongodb.net/db): ');
    const apiUrl = await question('API URL [http://localhost:5000/api]: ') || 'http://localhost:5000/api';
    const port = await question('Puerto del servidor [5000]: ') || '5000';

    const envContent = `# Configuración de MongoDB
MONGODB_URI=${mongoUri}

# Configuración de la API
VITE_API_URL=${apiUrl}
PORT=${port}
`;

    try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Archivo .env creado exitosamente!\n');
        console.log('📋 Próximos pasos:');
        console.log('   1. Ejecuta: npm run migrate-slugs (para agregar slugs a negocios existentes)');
        console.log('   2. Ejecuta: npm run server (para iniciar el servidor backend)');
        console.log('   3. Ejecuta: npm run dev (para iniciar el frontend)\n');
    } catch (error) {
        console.error('❌ Error al crear el archivo .env:', error.message);
    }

    rl.close();
}

setup();
