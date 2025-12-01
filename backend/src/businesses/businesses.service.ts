import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { UpdateUserPayload, UsersService } from '../users/users.service';
import { Business, BusinessDocument } from './schemas/business.schema';
import * as bcrypt from 'bcrypt';
import { ServicesService } from '../services/services.service';
import { BookingsService } from '../bookings/bookings.service';
import { generateSlots } from '../utils/generateSlots';
import { startOfDay, endOfDay } from 'date-fns';

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
  ) { }

  private assertAccess(authUser: AuthUser, business: BusinessDocument) {
    if (!authUser?.role || authUser.role === 'public') return;
    if (authUser.role === UserRole.Owner) return;
    if (authUser.role === UserRole.Business) {
      if (authUser.userId === business.ownerUserId) return;
      if (authUser.businessId && authUser.businessId.toString() === business.id.toString()) return;
    }
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
        businessId, // <-- FIX
      });
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
    const business = await this.businessModel.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);

    // Update root level fields if present in settings payload
    if (settings.businessName) business.businessName = settings.businessName;
    if (settings.logoUrl) business.logoUrl = settings.logoUrl;

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
    const business = await this.businessModel.findById(businessId);
    if (!business) throw new NotFoundException('Business not found');

    const service = await this.servicesService.findOne(serviceId, { role: 'public', userId: 'system' });
    if (!service) throw new NotFoundException('Service not found');

    // Parse date in local timezone to avoid UTC conversion issues
    // Input format: "YYYY-MM-DD"
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    // Adjust to local or UTC? Usually dates are passed as YYYY-MM-DD.
    // We need to query bookings for that day.
    // Assuming bookings are stored with full Date objects.

    // We need to find bookings that overlap with the day.
    // But BookingsService.findAll takes AuthUser.
    // We need a method in BookingsService to find by range or date, without auth check (or with system auth).
    // Or we can just use the model if we injected it, but we injected the service.
    // Let's add a method to BookingsService to find by criteria, or cast to any to access model if needed (bad practice).
    // Better: Add findByBusinessAndDate to BookingsService.

    // For now, I'll use a workaround or assume I can filter the results of findAll if I impersonate owner? No.
    // I need to add `findByBusinessAndDate` to `BookingsService`.
    // I will do that in a separate step or just use `findAll` with a special internal role if possible.
    // But `findAll` filters by role.

    // Let's assume I'll add `findByDateRange` to `BookingsService` next.
    // I'll write the call here assuming it exists.
    const bookings = await this.bookingsService.findByDateRange(businessId, startOfDay(queryDate), endOfDay(queryDate));
    const allServices = await this.servicesService.findAll({ role: 'public', userId: 'system' }, businessId);
    const serviceDurationMap = new Map(allServices.map(s => [s._id.toString(), s.durationMinutes]));

    console.log('===== SLOT GENERATION DEBUG =====');
    console.log('Date:', date);
    console.log('Service Duration:', service.durationMinutes);
    console.log('Business Hours:', JSON.stringify(business.settings?.businessHours, null, 2));
    console.log('Existing Bookings Count:', bookings.length);

    const slots = generateSlots(
      queryDate,
      service.durationMinutes,
      business.settings?.businessHours || [],
      bookings.map(b => ({
        scheduledAt: b.scheduledAt,
        durationMinutes: serviceDurationMap.get(b.serviceId) || service.durationMinutes // Fallback to current service duration if not found
      }))
    );

    console.log('Generated Slots:', slots);
    console.log('=================================');

    return slots;
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
}
