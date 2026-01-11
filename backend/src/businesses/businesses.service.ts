import { ForbiddenException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { UpdateUserPayload, UsersService } from '../users/users.service';
import { Business, BusinessDocument } from './schemas/business.schema';
import * as bcrypt from 'bcrypt';
import { ServicesService } from '../services/services.service';
import { BookingsService } from '../bookings/bookings.service';
import { AvailabilityService } from '../availability/availability.service';
import { generateSlots } from '../utils/generateSlots';
import { startOfDay, endOfDay } from 'date-fns';
import { sendEmail } from '../utils/email';
import { businessWelcomeTemplate } from '../utils/email-templates';

interface AuthUser {
  userId: string;
  role: string;
  businessId?: string;
}

interface CreateBusinessDto {
  name: string;
  businessName?: string;
  address?: string;
  logoUrl?: string;
  ownerUserId?: string; // <-- hacerlo opcional
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string; // <-- agregar este
  email?: string;
  phone?: string;
  type?: string;
  subscriptionStatus?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateBusinessDto extends Partial<CreateBusinessDto> { }

export interface CreateBusinessResult {
  business: BusinessDocument;
  credentials: {
    email: string;
    password: string | null;
    note?: string;
  };
}

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,
  ) { }

  async findById(id: string): Promise<BusinessDocument | null> {
    return this.businessModel.findById(id).exec();
  }

  private assertAccess(authUser: AuthUser, business: BusinessDocument) {
    if (!authUser?.role || authUser.role === 'public') return;
    if (authUser.role === UserRole.Owner) return;
    if (authUser.role === UserRole.Business) {
      if (authUser.userId === business.ownerUserId) return;
      if (authUser.businessId && authUser.businessId.toString() === business.id.toString()) return;
    }
    console.log('[DEBUG] assertAccess FAILED:', {
      authUser,
      businessId: business.id,
      ownerUserId: business.ownerUserId
    });
    throw new ForbiddenException('Not allowed');
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private generateTempPassword() {
    return Math.random().toString(36).slice(2, 10);
  }

  async create(
    payload: CreateBusinessDto & { ownerPassword?: string },
    authUser: AuthUser,
  ): Promise<CreateBusinessResult> {
    if (authUser.role !== UserRole.Owner) {
      throw new ForbiddenException('Only owners can create businesses');
    }

    // 1. Email del administrador
    const businessEmail = payload.email ?? `${this.slugify(payload.name)}@example.com`;

    // 2. Contraseña (si viene del frontend, úsala)
    const plainPassword = payload.ownerPassword || this.generateTempPassword();

    // 3. Ver si el usuario admin ya existe
    const existingUser = (await this.usersService.findByEmail(businessEmail)) as UserDocument | null;

    let createdUser: UserDocument | null = existingUser ?? null;

    if (!existingUser) {
      const password_hash = await bcrypt.hash(plainPassword, 10);
      createdUser = (await this.usersService.create({
        email: businessEmail,
        name: payload.ownerName ?? `${payload.name} Admin`,
        password_hash,
        role: UserRole.Business,
      })) as UserDocument;
    }

    if (!createdUser) {
      throw new Error('Error creating admin user');
    }

    const ownerUserId = createdUser._id.toString();

    // 4. Crear negocio asignando ownerUserId
    const business = new this.businessModel({
      ...payload,
      businessName: payload.businessName ?? payload.name,
      ownerUserId,
    }) as BusinessDocument;

    const savedBusiness = (await business.save()) as BusinessDocument;
    const businessId = savedBusiness._id.toString();

    // 5. Actualizar usuario asignándole el businessId
    if (!existingUser) {
      await this.usersService.update(ownerUserId, {
        businessId,
      });
    }

    // 6. Enviar correo de bienvenida
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
      await sendEmail({
        to: businessEmail,
        subject: '¡Bienvenido a BookPro! - Tus credenciales de acceso',
        html: businessWelcomeTemplate({
          ownerName: payload.ownerName ?? 'Administrador',
          businessName: savedBusiness.businessName || savedBusiness.name || 'Negocio',
          email: businessEmail,
          password: existingUser ? null : plainPassword,
          loginUrl: loginUrl
        })
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }

    return {
      business: savedBusiness,
      credentials: existingUser
        ? { email: businessEmail, password: null, note: 'Usuario ya existia' }
        : { email: businessEmail, password: plainPassword },
    };
  }

  async findAll(authUser: AuthUser) {
    if (authUser.role === UserRole.Owner) {
      return this.businessModel.find().lean();
    }
    if (authUser.role === UserRole.Business) {
      return this.businessModel.find({ ownerUserId: authUser.userId }).lean();
    }
    return this.businessModel.find({ subscriptionStatus: { $ne: 'inactive' } }).lean();
  }

  async findOne(id: string, authUser: AuthUser) {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const isPublicLike = authUser.role === 'public' || authUser.role === UserRole.Client;
    if (isPublicLike) {
      if (business.subscriptionStatus === 'inactive') {
        throw new ForbiddenException('Not allowed');
      }
    } else {
      this.assertAccess(authUser, business);
    }
    return business.toObject();
  }

  async findBySlug(slug: string, authUser: AuthUser) {
    const business = await this.businessModel.findOne({ slug }).exec();
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const isPublicLike = authUser.role === 'public' || authUser.role === UserRole.Client;
    if (isPublicLike) {
      if (business.subscriptionStatus === 'inactive') {
        throw new ForbiddenException('Not allowed');
      }
    } else {
      this.assertAccess(authUser, business);
    }
    return business.toObject();
  }

  async update(id: string, payload: UpdateBusinessDto, authUser: AuthUser) {
    const business = await this.businessModel.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);
    Object.assign(business, {
      ...payload,
      businessName: payload.businessName ?? payload.name ?? business.businessName ?? business.name,
      name: payload.name ?? payload.businessName ?? business.name ?? business.businessName,
    });

    const savedBusiness = await business.save();

    const userUpdate: UpdateUserPayload = {};
    if (typeof payload.ownerName === 'string') {
      userUpdate.name = payload.ownerName;
    }
    if (typeof payload.ownerEmail === 'string') {
      userUpdate.email = payload.ownerEmail;
    }
    if (payload.ownerPassword) {
      userUpdate.password = payload.ownerPassword;
    }
    if (Object.keys(userUpdate).length > 0 && business.ownerUserId) {
      await this.usersService.update(business.ownerUserId, userUpdate);
    }

    return savedBusiness;
  }

  async updateSettings(id: string, settings: any, authUser: AuthUser) {
    console.log(`[DEBUG] updateSettings called for ID: '${id}'`);
    const business = await this.businessModel.findById(id);
    if (!business) {
      console.log(`[DEBUG] Business not found for ID: '${id}'`);
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);

    // MIGRATION: Fix invalid paymentPolicy values BEFORE validation
    if (business.paymentConfig?.paymentPolicy) {
      const policy = business.paymentConfig.paymentPolicy as any;
      if (policy === 'PACKAGES' || !['RESERVE_ONLY', 'PAY_BEFORE_BOOKING', 'PACKAGE_OR_PAY'].includes(policy)) {
        console.log(`[MIGRATION] Fixing invalid paymentPolicy "${policy}" -> "PACKAGE_OR_PAY"`);
        business.paymentConfig.paymentPolicy = 'PACKAGE_OR_PAY';
        business.markModified('paymentConfig');
      }
    }

    // Update root level fields if present in settings payload
    if (settings.businessName) business.businessName = settings.businessName;
    if (settings.logoUrl) business.logoUrl = settings.logoUrl;
    if (settings.phone !== undefined) business.phone = settings.phone;
    if (settings.address !== undefined) business.address = settings.address;

    // Update nested settings
    if (!business.settings) {
      business.settings = {};
    }

    const mergedSettings = {
      ...business.settings,
      ...settings,
    };

    if (settings.businessHours) {
      mergedSettings.businessHours = settings.businessHours.map((hour: any) => {
        const intervals = Array.isArray(hour.intervals) && hour.intervals.length > 0
          ? hour.intervals
          : [{
            startTime: hour.startTime || '09:00',
            endTime: hour.endTime || '18:00',
          }];
        return {
          ...hour,
          intervals,
        };
      });
    }

    business.settings = mergedSettings;

    if (settings.bookingConfig) {
      business.bookingConfig = {
        ...business.bookingConfig,
        ...settings.bookingConfig,
      };
    }

    if (settings.taxConfig) {
      // BLINDAJE E: Protección de Identidad Fiscal
      const oldTaxId = business.taxConfig?.taxId;
      const newTaxId = settings.taxConfig.taxId;

      if (oldTaxId && newTaxId && oldTaxId !== newTaxId && business.connectStatus === 'ACTIVE') {
        console.warn(`[SECURITY] Business ${id} changed taxId from ${oldTaxId} to ${newTaxId} while ACTIVE. Invalidating Connect status.`);
        business.connectStatus = 'NOT_STARTED';
        business.paymentMode = 'BOOKPRO_COLLECTS';
        // Desvinculamos la cuenta anterior para forzar nuevo proceso con el nuevo RFC
        business.stripeConnectAccountId = undefined;
      }

      business.taxConfig = {
        ...business.taxConfig,
        ...settings.taxConfig,
      };
    }

    return business.save();
  }

  async remove(id: string, authUser: AuthUser) {
    const business = await this.businessModel.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);
    await business.deleteOne();
    return { success: true };
  }

  async getSlots(businessId: string, date: string, serviceId: string) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    const results = await this.availabilityService.getSlotsInRange(businessId, startDate, endDate, serviceId);
    return results[0]?.slots || [];
  }

  async updateOnboarding(id: string, step: number, isCompleted: boolean, authUser: AuthUser) {
    const business = await this.businessModel.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);

    business.onboardingStep = step;
    if (isCompleted) {
      business.isOnboardingCompleted = true;
      // Opcional: cambiar status a active si estaba en trial
      if (business.subscriptionStatus === 'trial') {
        business.subscriptionStatus = 'active';
      }
    }

    return business.save();
  }

  async updatePaymentConfig(id: string, config: any, authUser: AuthUser) {
    const business = await this.businessModel.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);

    // Update root level fields if present in config
    if (config.stripeConnectAccountId !== undefined) {
      business.stripeConnectAccountId = config.stripeConnectAccountId;
    }

    // Automatic Decision Logic:
    // If Stripe Connect Account ID exists -> DIRECT_TO_BUSINESS
    // Else -> BOOKPRO_COLLECTS
    if (business.stripeConnectAccountId && business.stripeConnectAccountId.trim() !== '') {
      business.paymentMode = 'DIRECT_TO_BUSINESS';
    } else {
      business.paymentMode = 'BOOKPRO_COLLECTS';
    }

    // Note: We intentionally ignore config.paymentMode as it is now system-determined.

    // Filter out root fields from nested paymentConfig update
    const { paymentMode, stripeConnectAccountId, allowTransfer, bank, clabe, holderName, instructions, method, ...restConfig } = config;

    business.paymentConfig = {
      ...business.paymentConfig,
      ...restConfig,
    };
    return business.save();
  }
}
