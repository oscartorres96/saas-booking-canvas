import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const email = 'owner@bookpro.com';
    const password = 'BookProAdmin2024!'; // Contraseña segura y memorable

    console.log(`\n--- ADMIN RESET SCRIPT ---\n`);
    console.log(`Checking user ${email}...`);

    const existingUser = await usersService.findByEmail(email);

    if (existingUser) {
        console.log(`User found (ID: ${existingUser._id}). Updating password...`);
        // Force active just in case
        await usersService.update(existingUser._id.toString(), {
            password,
            // @ts-ignore
            isActive: true
        });
        console.log('Password updated successfully.');
    } else {
        console.log('User NOT found. Creating new admin user...');
        const password_hash = await bcrypt.hash(password, 10);
        const newUser = await usersService.create({
            email,
            password_hash,
            name: 'Owner Admin',
            role: 'owner',
            isActive: true,
        });
        console.log(`User created successfully with ID: ${newUser._id}`);
    }

    console.log(`\nCREDENTIALS:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`\n--------------------------\n`);

    await app.close();
    process.exit(0);
}

bootstrap();
