import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Business from './models/Business.js';
import Client from './models/Client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes

// Get business profile by slug
app.get('/api/business/:slug', async (req, res) => {
    try {
        const business = await Business.findOne({ slug: req.params.slug });

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        res.json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get business profile (default/first business)
app.get('/api/business', async (req, res) => {
    try {
        // For simplicity, we'll fetch the first document or a specific one
        // In a real app, you might query by ID or domain
        let business = await Business.findOne();

        if (!business) {
            // Return default data if no business found (or you could seed it here)
            return res.status(404).json({ message: 'Business not found' });
        }

        res.json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all businesses (Admin)
app.get('/api/admin/businesses', async (req, res) => {
    try {
        const businesses = await Business.find().sort({ createdAt: -1 });
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get clients for a business (Business Dashboard)
app.get('/api/business/:businessId/clients', async (req, res) => {
    try {
        // In a real app, validate that the logged-in user owns this business
        // For now, we'll just return mock data if no clients found, or empty array
        const clients = await Client.find({ businessId: req.params.businessId }).sort({ appointmentDate: 1 });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create/Update business profile (optional, for testing)
app.post('/api/business', async (req, res) => {
    try {
        const { businessName, ...rest } = req.body;
        let business = await Business.findOne();

        if (business) {
            // Update existing
            Object.assign(business, req.body);
            await business.save();
        } else {
            // Create new
            business = new Business(req.body);
            await business.save();
        }
        res.json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
