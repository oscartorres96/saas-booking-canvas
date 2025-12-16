import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    // Access the User Model directly
    const userModel = app.get<Model<UserDocument>>(getModelToken('User'));

    // Find the most recently created user that still has an activation token
    const user = await userModel.findOne({
        activationToken: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    if (user) {
        console.log(`\n--- ÚLTIMO USUARIO PENDIENTE DE ACTIVACIÓN ---`);
        console.log(`Email: ${user.email}`);
        console.log(`Nombre: ${user.name}`);
        console.log(`\n🔗 LINK DE ACTIVACIÓN (Copia y pega en tu navegador):`);
        console.log(`http://localhost:5173/activate/${user.activationToken}`);
        console.log(`----------------------------------------------\n`);
    } else {
        console.log('No se encontraron usuarios pendientes de activación.');
    }

    await app.close();
    process.exit(0);
}

bootstrap();
