// @ts-nocheck
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Business } from '../businesses/schemas/business.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
    const UserModel = app.get(getModelToken(User.name));
    const BusinessModel = app.get(getModelToken(Business.name));

    const email = 'chivaton60@gmail.com';
    const users = await UserModel.find({ email });
    console.log(`\n--- User Info (${email}) ---`);
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
        const u = users[0];
        console.log(`\n--- Searching Business for ownerId: ${u._id} (Type: ${typeof u._id}) ---`);

        const allBusinesses = await BusinessModel.find({});
        console.log(`Total Businesses in DB: ${allBusinesses.length}`);

        allBusinesses.forEach(b => {
            console.log(`Biz: ${b.name}, Owner: ${b.ownerId} (Type: ${typeof b.ownerId}) Match? ${String(b.ownerId) === String(u._id)}`);
        });

        const myBusiness = await BusinessModel.findOne({ ownerId: u._id });
        console.log('\n--- Direct Search Result ---');
        console.log(myBusiness ? `✅ FOUND: ${myBusiness.name}` : '❌ NOT FOUND');
    }

    await app.close();
    process.exit(0);
}
bootstrap();
