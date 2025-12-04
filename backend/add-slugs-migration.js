const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://bookpro_user:BookPro2025$!@bookprocluster.gxtor09.mongodb.net/bookpro?appName=BookProCluster';

const businessSchema = new mongoose.Schema({}, { strict: false });
const Business = mongoose.model('Business', businessSchema);

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function addSlugs() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const businesses = await Business.find({});
        console.log(`\n=== Updating ${businesses.length} businesses ===`);

        for (const business of businesses) {
            const name = business.businessName || business.name;
            if (!name) {
                console.log(`Skipping business with no name: ${business._id}`);
                continue;
            }

            const slug = slugify(name);
            console.log(`Updating "${name}" -> slug: "${slug}"`);

            await Business.updateOne(
                { _id: business._id },
                { $set: { slug } }
            );
        }

        console.log('\n✅ All businesses updated with slugs');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addSlugs();
