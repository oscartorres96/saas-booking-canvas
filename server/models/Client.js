import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    appointmentDate: { type: Date, required: true },
    service: String,
    status: { type: String, enum: ['confirmed', 'pending', 'completed', 'cancelled'], default: 'pending' },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Client', ClientSchema);
