const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'bookpro' });

    // Define a simple Booking schema
    const BookingSchema = new mongoose.Schema({
        clientEmail: String,
        resourceId: String,
        scheduledAt: Date,
        status: String,
        businessId: String
    });

    const Booking = mongoose.model('Booking', BookingSchema);

    const businessId = '6941cf07956e9c7046a13829';
    const scheduledAt = '2025-12-29T15:00:00.000Z';
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    console.log(`Searching for: businessId=${businessId}, ${start.toISOString()} <= scheduledAt < ${end.toISOString()}`);

    const bookings = await Booking.find({
        businessId: businessId,
        scheduledAt: { $gte: start, $lt: end },
        status: { $ne: 'cancelled' },
        resourceId: { $exists: true, $ne: null },
    });

    console.log(`Found ${bookings.length} bookings:`);
    bookings.forEach(b => {
        console.log(`- ID: ${b._id}, res: ${b.resourceId}, time: ${b.scheduledAt.toISOString()}`);
    });

    await mongoose.disconnect();
}

check().catch(console.error);
