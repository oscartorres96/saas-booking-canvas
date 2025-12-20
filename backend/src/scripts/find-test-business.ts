
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const businessesService = app.get(BusinessesService);

    const email = 'chivaton60@gmail.com';
    const fakeAuthUser = { userId: 'system', role: 'owner' };

    const user = await usersService.findByEmail(email);

    if (!user || !user.businessId) {
        console.log("User or Business not found for email:", email);
        await app.close();
        return;
    }

    const business = await businessesService.findOne(user.businessId, fakeAuthUser);

    console.log("\n--- TEST DATA ---");
    console.log("Business Name:", business.name);
    console.log("Business ID:", business._id.toString());
    console.log("Public Booking URL: http://localhost:5173/business/" + business._id.toString() + "/booking");

    await app.close();
    process.exit(0);
}

bootstrap();
