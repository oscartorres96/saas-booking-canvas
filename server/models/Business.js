import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
    id: String,
    name: String,
    duration: String,
    price: String,
    description: String
});

const BusinessSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    type: { type: String, enum: ['dentist', 'barber', 'nutritionist', 'other'], default: 'other' },
    ownerName: String,
    logoUrl: String,
    primaryColor: String,
    services: [ServiceSchema],
    businessAddress: String,
    businessPhone: String,
    businessEmail: String,
    businessSocials: {
        facebook: String,
        instagram: String
    },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'trial'], default: 'trial' },
    metadata: { type: Map, of: String }, // Flexible metadata
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Business', BusinessSchema);
