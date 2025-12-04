const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://bookpro_user:BookPro2025$!@bookprocluster.gxtor09.mongodb.net/bookpro?appName=BookProCluster';

const businessSchema = new mongoose.Schema({
    name: String,
    businessName: String,
    slug: String, // Wait, does the schema have slug?
    // Let's check schema definition if possible, or just dump the object
}, { strict: false });

const Business = mongoose.model('Business', businessSchema);

async function checkBusinesses() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const businesses = await Business.find({});
        console.log('\n=== Current Businesses ===');
        businesses.forEach(b => {
            console.log(`Name: ${b.name}, BusinessName: ${b.businessName}, ID: ${b._id}`);
            // Check if slug exists in the object
            // Usually slug is derived or stored.
            // Let's print the whole object keys to see
            console.log(JSON.stringify(b, null, 2));
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkBusinesses();
