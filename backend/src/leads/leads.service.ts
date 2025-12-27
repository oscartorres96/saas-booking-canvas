import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ApproveLeadDto } from './dto/approve-lead.dto';
import { RejectLeadDto } from './dto/reject-lead.dto';
import { NotificationService } from '../services/notification.service';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class LeadsService {
    constructor(
        @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
        private readonly notificationService: NotificationService
    ) { }

    async create(createLeadDto: CreateLeadDto) {
        // Save to DB
        const createdLead = new this.leadModel({
            ...createLeadDto,
            type: 'demo',
            status: 'pending'
        });
        await createdLead.save();

        // Send Notifications
        await this.notificationService.sendDemoRequestNotification(createLeadDto);
        return { success: true, message: 'Solicitud enviada correctamente' };
    }

    async createBusinessRegistration(createLeadDto: CreateLeadDto) {
        // Save to DB
        const createdLead = new this.leadModel({
            ...createLeadDto,
            type: 'registration',
            status: 'pending'
        });
        await createdLead.save();

        // Send Notifications
        await this.notificationService.sendBusinessRegistrationNotification(createLeadDto);
        return { success: true, message: 'Solicitud de registro enviada correctamente' };
    }

    async getPendingLeads() {
        return this.leadModel.find({ status: { $in: ['pending', 'new'] } }).sort({ createdAt: -1 }).exec();
    }

    async getAllLeads() {
        return this.leadModel.find().sort({ createdAt: -1 }).exec();
    }

    async approveLead(leadId: string, approveDto: ApproveLeadDto, adminUserId: string) {
        const lead = await this.leadModel.findById(leadId);

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (lead.status !== 'pending' && lead.status !== 'new') {
            throw new BadRequestException('Lead is not in pending status');
        }

        // Check if email already has an account
        const existingUser = await this.userModel.findOne({ email: lead.email });
        if (existingUser) {
            throw new BadRequestException('An account already exists for this email');
        }

        // Generate activation token and temporary password
        const activationToken = crypto.randomBytes(32).toString('hex');
        const temporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Token expires in 48 hours
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 48);

        // Create User
        const newUser = await this.userModel.create({
            email: lead.email,
            password_hash: hashedPassword,
            name: lead.name,
            role: 'business',
            isActive: false,
            activationToken,
            activationTokenExpires: tokenExpires,
            createdFromLead: leadId,
        });

        // Determine subscription status based on access type
        const subscriptionStatus = approveDto.accessType === 'trial' ? 'trial' : 'pending_payment';

        // Create Business
        const businessName = lead.company || `${lead.name}'s Business`;
        const newBusiness = await this.businessModel.create({
            name: businessName,
            businessName: businessName,
            ownerUserId: newUser._id.toString(),
            email: lead.email,
            phone: lead.phone,
            subscriptionStatus,
            onboardingCompleted: false,
            onboardingStep: 1,
        });

        // Update user with businessId
        newUser.businessId = newBusiness._id.toString();
        await newUser.save();

        // Update lead status
        lead.status = 'approved';
        lead.approvedBy = adminUserId;
        lead.approvedAt = new Date();
        lead.accountCreated = true;
        lead.createdUserId = newUser._id.toString();
        await lead.save();

        // Send activation email
        await this.notificationService.sendAccountActivationEmail({
            email: lead.email,
            name: lead.name,
            activationToken,
            temporaryPassword,
            accessType: approveDto.accessType,
        });

        return {
            success: true,
            message: 'Lead approved and account created successfully',
            data: {
                userId: newUser._id,
                businessId: newBusiness._id,
                accessType: approveDto.accessType,
            }
        };
    }

    async rejectLead(leadId: string, rejectDto: RejectLeadDto, adminUserId: string) {
        const lead = await this.leadModel.findById(leadId);

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (lead.status !== 'pending' && lead.status !== 'new') {
            throw new BadRequestException('Lead is not in pending status');
        }

        lead.status = 'rejected';
        lead.approvedBy = adminUserId; // Track who rejected
        lead.approvedAt = new Date();
        lead.rejectedReason = rejectDto.reason;
        await lead.save();

        // Optional: Send rejection email
        // await this.notificationService.sendLeadRejectionEmail(lead, rejectDto.reason);

        return {
            success: true,
            message: 'Lead rejected successfully'
        };
    }

    private generateTemporaryPassword(): string {
        // Generate a secure random password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

