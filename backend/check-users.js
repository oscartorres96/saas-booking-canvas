const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb+srv://bookpro_user:BookPro2025$!@bookprocluster.gxtor09.mongodb.net/?appName=BookProCluster';

const userSchema = new mongoose.Schema({
    email: String,
    password_hash: String,
    name: String,
    role: String,
    businessId: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('\n=== Current Users ===');
        users.forEach(user => {
            console.log(`Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
        });

        // Check if owner@bookpro.com exists
        const ownerUser = await User.findOne({ email: 'owner@bookpro.com' });

        if (!ownerUser) {
            console.log('\n=== Creating owner user ===');
            const password_hash = await bcrypt.hash('admin2025', 10);
            const newOwner = new User({
                email: 'owner@bookpro.com',
                password_hash,
                name: 'System Owner',
                role: 'owner',
            });
            await newOwner.save();
            console.log('Owner user created successfully!');
        } else {
            console.log('\n=== Owner user exists ===');
            console.log('Testing password...');
            const isValid = await bcrypt.compare('admin2025', ownerUser.password_hash);
            console.log(`Password valid: ${isValid}`);

            if (!isValid) {
                console.log('Updating password...');
                ownerUser.password_hash = await bcrypt.hash('admin2025', 10);
                await ownerUser.save();
                console.log('Password updated!');
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
