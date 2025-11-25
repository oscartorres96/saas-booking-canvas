import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Business from './models/Business.js';

dotenv.config();

// Función para convertir un nombre a slug
function createSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD') // Normalizar caracteres Unicode
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .trim()
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-'); // Eliminar guiones duplicados
}

async function migrateBusinesses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        // Obtener todos los negocios sin slug
        const businesses = await Business.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });

        console.log(`Found ${businesses.length} businesses without slug`);

        for (const business of businesses) {
            const slug = createSlug(business.businessName);

            // Verificar si el slug ya existe
            let finalSlug = slug;
            let counter = 1;
            while (await Business.findOne({ slug: finalSlug, _id: { $ne: business._id } })) {
                finalSlug = `${slug}-${counter}`;
                counter++;
            }

            business.slug = finalSlug;
            await business.save();
            console.log(`Updated ${business.businessName} with slug: ${finalSlug}`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateBusinesses();
