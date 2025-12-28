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
        businessId: String,
        serviceName: String
    }, { timestamps: true });

    const Booking = mongoose.model('Booking', BookingSchema);

    const recent = await Booking.find({
        resourceId: '2-1',
        status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 }).limit(1);

    if (recent.length > 0) {
        const b = recent[0];
        console.log(`Booking B10 (2-1):`);
        console.log(`- ID: ${b._id}`);
        console.log(`- BusinessId: ${b.businessId}`);
        console.log(`- Status: ${b.status}`);
        console.log(`- ScheduledAt (ISO): ${b.scheduledAt.toISOString()}`);
    } else {
        console.log('No B10 booking found');
    }

    await mongoose.disconnect();
}

check().catch(console.error);
