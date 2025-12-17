const mongoose = require('mongoose');

// Intentamos conectar a la base de datos local por defecto
const uri = 'mongodb://127.0.0.1:27017/saas-booking';

async function run() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        // Buscar el usuario más reciente con token de activación
        // Usamos la colección 'users' directamente
        const user = await mongoose.connection.db.collection('users').findOne(
            { activationToken: { $exists: true, $ne: null } },
            { sort: { createdAt: -1 } }
        );

        if (user) {
            console.log('\n!!! LINK ENCONTRADO !!!');
            console.log(`Usuario: ${user.email}`);
            console.log(`Link: http://localhost:5173/activate/${user.activationToken}`);
        } else {
            console.log('No se encontraron usuarios pendientes de activación.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}
run();
