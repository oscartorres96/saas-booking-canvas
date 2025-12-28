import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { startOfDay, endOfDay } from 'date-fns';
import { ResourceHold, ResourceHoldDocument } from '../resource-map/schemas/resource-hold.schema';
import { UserRole } from '../users/schemas/user.schema';
import { Booking, BookingDocument, BookingStatus, PaymentStatus } from './schemas/booking.schema';
import { NotificationService } from '../services/notification.service';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { CustomerAssetsService } from '../customer-assets/customer-assets.service';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { OtpService } from './otp/otp.service';

export interface CreateBookingPayload {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  businessId?: string;
  serviceId: string;
  serviceName?: string;
  scheduledAt: Date;
  status?: string;
  notes?: string;
  userId?: string;
  accessCode?: string;
  resourceId?: string;
  assetId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  otpToken?: string;
  sessionId?: string;
  resourceMapSnapshot?: any;
}

export type UpdateBookingPayload = Partial<CreateBookingPayload>;

interface AuthUser {
  userId: string;
  role: string;
  businessId?: string;
}

const generateAccessCode = () => Math.random().toString().slice(2, 8);

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
    private readonly notificationService: NotificationService,
    private readonly customerAssetsService: CustomerAssetsService,
    private readonly otpService: OtpService,
    @InjectModel(ResourceHold.name) private readonly resourceHoldModel: Model<ResourceHoldDocument>,
  ) { }

  private buildFilter(authUser: AuthUser) {
    // Si el usuario tiene un businessId asociado, restringir las reservas a ese negocio
    // Esto aplica tanto para roles 'business' como 'owner' de un negocio específico
    if (authUser.businessId) {
      return { businessId: authUser.businessId };
    }

    // Si es Owner pero NO tiene businessId, asumimos que es un SuperAdmin de la plataforma
    if (authUser.role === UserRole.Owner) return {};

    if (authUser.role === UserRole.Business) {
      // Fallback por seguridad, aunque debería haber entrado en el if de arriba
      if (!authUser.businessId) throw new ForbiddenException('Business context missing');
      return { businessId: authUser.businessId };
    }

    if (authUser.role === UserRole.Client) return { userId: authUser.userId };

    return {};
  }

  async create(payload: CreateBookingPayload, authUser: AuthUser): Promise<Booking> {
    if (authUser.role === UserRole.Business) {
      if (!authUser.businessId) throw new ForbiddenException('Business context missing');
      payload.businessId = authUser.businessId;
    }
    if (authUser.role === UserRole.Client) {
      payload.userId = authUser.userId;
      if (!authUser.businessId) throw new ForbiddenException('Business context missing');
      if (!payload.businessId) {
        payload.businessId = authUser.businessId;
      }
    }
    if ((!authUser || authUser.role === 'public') && !payload.businessId) {
      throw new ForbiddenException('Business context missing');
    }
    if (!payload.accessCode) {
      payload.accessCode = generateAccessCode();
    }

    // Get business settings
    const business = await this.businessModel.findById(payload.businessId).lean();
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Business Rule: Double booking prevention (configurable)
    if (!business.bookingConfig?.allowMultipleBookingsPerDay) {
      const sameDayFilter: any = {
        businessId: payload.businessId,
        scheduledAt: {
          $gte: startOfDay(payload.scheduledAt),
          $lte: endOfDay(payload.scheduledAt),
        },
        status: { $ne: BookingStatus.Cancelled },
      };
      const identityFilters = [];
      if (payload.clientEmail) identityFilters.push({ clientEmail: payload.clientEmail });
      if (payload.userId) identityFilters.push({ userId: payload.userId });
      if (payload.clientPhone) identityFilters.push({ clientPhone: payload.clientPhone });

      if (identityFilters.length > 0) {
        const existingBooking = await this.bookingModel.findOne({
          ...sameDayFilter,
          $or: identityFilters,
        }).lean();

        if (existingBooking) {
          throw new ConflictException({
            message: 'Ya tienes una reserva para este día. El negocio no permite múltiples reservas por día para el mismo cliente.',
            code: 'BOOKING_ALREADY_EXISTS',
            bookingId: existingBooking._id?.toString?.(),
            accessCode: existingBooking.accessCode,
            businessId: existingBooking.businessId,
          });
        }
      }
    }

    // Validar servicio: debe existir y pertenecer al negocio
    const service = await this.serviceModel.findById(payload.serviceId).lean();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.businessId && payload.businessId && service.businessId.toString() !== payload.businessId.toString()) {
      throw new ForbiddenException('Service does not belong to this business');
    }
    if (service.active === false) {
      throw new ForbiddenException('Service is inactive');
    }

    // Business Rule: Ensure product/package is provided if service requires it
    if (service.requireProduct && !payload.assetId) {
      throw new ForbiddenException('Este servicio requiere la compra previa de un pase o paquete.');
    }

    // Business Rule: Payment Policy Enforcement for public bookings
    const policy = business.paymentConfig?.paymentPolicy || 'RESERVE_ONLY';
    const isPublic = !authUser || authUser.role === 'public';

    if (isPublic) {
      if ((policy === 'PAY_BEFORE_BOOKING' || policy === 'PACKAGE_OR_PAY') &&
        !payload.assetId &&
        payload.paymentStatus !== PaymentStatus.Paid &&
        payload.status !== BookingStatus.PendingPayment && // Permitir si es para pago posterior
        service.price > 0) {
        throw new ForbiddenException('Este negocio requiere el pago previo o el uso de un paquete para confirmar la reserva.');
      }
    }

    // ✅ Validación de capacidad por slot mejorada
    // Buscamos todas las reservas del mismo día para verificar solapamientos
    const dayStart = startOfDay(new Date(payload.scheduledAt));
    const dayEnd = endOfDay(new Date(payload.scheduledAt));

    const dayBookings = await this.bookingModel.find({
      businessId: payload.businessId,
      scheduledAt: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: BookingStatus.Cancelled },
    }).lean();

    // RULE: If there's already a PENDING_PAYMENT booking for this EXACT user/slot/service, just REUSE it
    const myPendingBooking = dayBookings.find(b =>
      b.status === BookingStatus.PendingPayment &&
      b.serviceId?.toString() === payload.serviceId &&
      new Date(b.scheduledAt).getTime() === new Date(payload.scheduledAt).getTime() &&
      (b.clientEmail === payload.clientEmail || (payload.userId && b.userId?.toString() === payload.userId)) &&
      (!payload.resourceId || b.resourceId === payload.resourceId)
    );

    if (myPendingBooking) {
      console.log(`[DEBUG] Reusing existing pending_payment booking: ${(myPendingBooking as any)._id}`);
      return myPendingBooking as any;
    }

    // Obtenemos duraciones de todos los servicios para calcular solapamientos correctamente
    const allServices = await this.serviceModel.find({ businessId: payload.businessId }).lean();
    const serviceDurationMap = new Map(allServices.map(s => [s._id.toString(), s.durationMinutes]));

    const requestedDuration = service.durationMinutes || 30;
    const requestedStart = new Date(payload.scheduledAt);
    const requestedEnd = new Date(requestedStart.getTime() + requestedDuration * 60000);

    // Contar cuántas reservas se solapan con el horario solicitado
    const overlappingBookings = dayBookings.filter(b => {
      const bStart = new Date(b.scheduledAt);
      const bDuration = serviceDurationMap.get(b.serviceId?.toString()) || requestedDuration;
      const bEnd = new Date(bStart.getTime() + bDuration * 60000);

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return requestedStart < bEnd && requestedEnd > bStart;
    });

    // Determinar capacidad máxima
    let maxCapacity = 1;
    if (business.resourceConfig?.enabled) {
      maxCapacity = business.resourceConfig.resources?.filter(r => r.isActive).length || 1;
    } else if (business.bookingCapacityConfig?.mode === 'MULTIPLE') {
      maxCapacity = business.bookingCapacityConfig.maxBookingsPerSlot || 1;
    }

    // Protection for specific resource double-booking
    if (payload.resourceId) {
      const isResourceTaken = overlappingBookings.some(b =>
        b.resourceId === payload.resourceId &&
        b.status !== BookingStatus.Cancelled
      );
      if (isResourceTaken) {
        throw new ConflictException({
          message: 'Este lugar ya ha sido reservado por alguien más para este horario. Por favor elige otro lugar.',
          code: 'RESOURCE_TAKEN',
          resourceId: payload.resourceId
        });
      }
    }

    // Aplicar reglas de capacidad
    if (overlappingBookings.length >= maxCapacity) {
      throw new ConflictException({
        message: 'Este horario ya no está disponible por falta de capacidad. Por favor elige otro.',
        code: 'SLOT_UNAVAILABLE',
        details: {
          current: overlappingBookings.length,
          max: maxCapacity
        }
      });
    }

    // Handle Asset Consumption
    if (payload.assetId) {
      if (!payload.clientEmail) {
        throw new ForbiddenException('Email required for asset usage verification');
      }

      const isVerified = await this.otpService.isTokenValid(
        payload.clientEmail,
        payload.otpToken || '',
        'ASSET_USAGE'
      );

      if (!isVerified) {
        throw new ForbiddenException({
          message: 'Se requiere verificación por correo para usar tus créditos.',
          code: 'OTP_REQUIRED',
          requiresOtp: true,
          reason: 'ASSET_USAGE'
        });
      }

      await this.customerAssetsService.consumeUse(payload.assetId, {
        email: payload.clientEmail,
        phone: payload.clientPhone,
        referenceDate: payload.scheduledAt,
      });
      payload.paymentStatus = PaymentStatus.Paid;
      payload.status = BookingStatus.Confirmed;
      payload.paymentMethod = 'package';
    }

    // Ensure serviceName is set
    if (!payload.serviceName && service) {
      payload.serviceName = service.name;
    }

    if (payload.resourceId && business.resourceConfig?.enabled) {
      payload.resourceMapSnapshot = business.resourceConfig;
    }

    const booking = new this.bookingModel(payload);
    const savedBooking = await booking.save();

    // Clear resource hold if present
    if (savedBooking.status === BookingStatus.Confirmed || savedBooking.paymentStatus === PaymentStatus.Paid) {
      await this.clearHoldsForBooking(savedBooking, payload.sessionId);
    }

    // Enviar notificaciones por email (Skip if pending payment)
    console.log(`[DEBUG] Booking created: ${savedBooking._id}, status: ${savedBooking.status}`);

    // Strict check for the status
    if (savedBooking.status !== BookingStatus.PendingPayment && (savedBooking.status as string) !== 'pending_payment') {
      console.log(`[DEBUG] Triggering confirmation email for booking: ${savedBooking._id}`);
      await this.sendConfirmationEmail(savedBooking);
    } else {
      console.log(`[DEBUG] Skipping email for booking ${savedBooking._id} because status is ${savedBooking.status}`);
    }

    return savedBooking;
  }

  /** Genera token de acceso magico y envia email de confirmacion */
  async sendConfirmationEmail(booking: Booking): Promise<void> {
    // Also clear holds here as a backup for webhook-confirmed bookings
    await this.clearHoldsForBooking(booking);

    try {
      let magicLinkToken: string | undefined;
      if (booking.clientEmail) {
        magicLinkToken = await this.otpService.generateMagicLinkToken(booking.clientEmail);
      }
      await this.notificationService.sendBookingConfirmation(booking, magicLinkToken);
    } catch (error) {
      console.error('Error al enviar email de confirmacion:', error);
    }
  }

  /** Clears any temporary holds for the resource in the booking's slot */
  private async clearHoldsForBooking(booking: Booking, sessionId?: string): Promise<void> {
    if (!booking.resourceId || !booking.businessId || !booking.scheduledAt) return;

    const query: any = {
      businessId: booking.businessId,
      resourceId: booking.resourceId,
      scheduledAt: {
        $gte: new Date(new Date(booking.scheduledAt).getTime() - 1000),
        $lt: new Date(new Date(booking.scheduledAt).getTime() + 1000)
      }
    };

    // If sessionId is provided, we can be more specific, but generally if it's booked, 
    // all holds for that spot/time should be gone.
    if (sessionId) {
      // If we have sessionId, we definitely want to clear that specific one plus any others
      // but let's just clear ALL for this resource/slot since it's now officially taken.
    }

    const res = await this.resourceHoldModel.deleteMany(query);
    if (res.deletedCount > 0) {
      console.log(`[BookingsService] Cleared ${res.deletedCount} holds for confirmed booking ${(booking as any)._id}`);
    }
  }

  async findAll(authUser: AuthUser): Promise<Booking[]> {
    return this.bookingModel.find(this.buildFilter(authUser)).lean();
  }

  async findOne(id: string, authUser: AuthUser): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).lean();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const filter = this.buildFilter(authUser);
    if (
      (filter.businessId && booking.businessId?.toString() !== filter.businessId.toString()) ||
      (filter.userId && booking.userId?.toString() !== filter.userId.toString())
    ) {
      throw new ForbiddenException('Not allowed');
    }
    return booking;
  }

  async update(id: string, payload: UpdateBookingPayload, authUser: AuthUser): Promise<Booking> {
    const filter = { _id: new Types.ObjectId(id), ...this.buildFilter(authUser) };
    const existing = await this.bookingModel.findOne(filter).lean();
    if (!existing) throw new NotFoundException('Booking not found');

    const updated = await this.bookingModel.findOneAndUpdate(
      filter,
      payload,
      { new: true },
    ).lean();

    if (!updated) throw new NotFoundException('Booking not found');

    if (
      payload.status === BookingStatus.Cancelled &&
      existing.status !== BookingStatus.Cancelled
    ) {
      await this.notificationService.sendCancellationNotification(updated as Booking);
    } else if (
      payload.status === BookingStatus.Completed &&
      existing.status !== BookingStatus.Completed
    ) {
      await this.notificationService.sendBookingCompletedNotification(updated as Booking);
    } else if (
      payload.status === BookingStatus.Cancelled &&
      existing.assetId
    ) {
      // Refund criteria: Based on business configuration (cancellationWindowHours)
      const business = await this.businessModel.findById(existing.businessId).lean();
      const windowHours = business?.bookingConfig?.cancellationWindowHours || 0;

      const now = new Date();
      const deadline = new Date(existing.scheduledAt.getTime() - windowHours * 60 * 60 * 1000);

      if (now <= deadline) {
        await this.customerAssetsService.refundUse(existing.assetId);
      } else {
        // Log or handle case where cancellation is too late for refund
        console.log(`[REFUND] Cancellation too late for booking ${id}. Deadline was ${deadline}`);
      }
    }

    return updated;
  }

  async findByEmailAndCode(clientEmail: string, accessCode: string, businessId?: string) {
    const filter: any = {
      clientEmail,
    };
    if (businessId) filter.businessId = businessId;
    return this.bookingModel.find(filter).lean();
  }

  async cancelPublic(bookingId: string, clientEmail: string, accessCode: string) {
    const booking = await this.bookingModel.findOne({
      _id: new Types.ObjectId(bookingId),
      clientEmail,
      accessCode,
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada o credenciales incorrectas');
    }

    booking.status = BookingStatus.Cancelled;

    // Refund Logic for Customer Assets
    if (booking.assetId) {
      const business = await this.businessModel.findById(booking.businessId).lean();
      const windowHours = business?.bookingConfig?.cancellationWindowHours || 0;

      const now = new Date();
      const deadline = new Date(booking.scheduledAt.getTime() - windowHours * 60 * 60 * 1000);

      if (now <= deadline) {
        await this.customerAssetsService.refundUse(booking.assetId);
      }
    }

    const cancelledBooking = await booking.save();

    // Enviar notificación de cancelación
    await this.notificationService.sendCancellationNotification(cancelledBooking);

    return cancelledBooking;
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const result = await this.bookingModel.findOneAndDelete({ _id: new Types.ObjectId(id), ...this.buildFilter(authUser) });
    if (!result) {
      throw new NotFoundException('Booking not found');
    }
  }

  async findByDateRange(businessId: string, start: Date, end: Date) {
    return this.bookingModel.find({
      businessId,
      scheduledAt: { $gte: start, $lte: end },
      status: { $ne: BookingStatus.Cancelled },
    }).lean();
  }

  async confirmPaymentTransfer(id: string, paymentDetails: { bank?: string; clabe?: string; holderName?: string }) {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    booking.paymentStatus = PaymentStatus.PendingVerification;
    booking.status = BookingStatus.PendingPayment;
    booking.paymentDetails = {
      ...paymentDetails,
      transferDate: new Date(),
    };
    booking.paymentMethod = 'bank_transfer';

    return booking.save();
  }

  async verifyPaymentTransfer(id: string, authUser: AuthUser) {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    const filter = this.buildFilter(authUser);
    if (filter.businessId && booking.businessId?.toString() !== filter.businessId.toString()) {
      throw new ForbiddenException('Not allowed');
    }

    booking.paymentStatus = PaymentStatus.Paid;
    booking.status = BookingStatus.Confirmed;

    const saved = await booking.save();

    // Optionally notify customer
    await this.sendConfirmationEmail(saved as Booking);

    return saved;
  }

  async rejectPaymentTransfer(id: string, authUser: AuthUser) {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    const filter = this.buildFilter(authUser);
    if (filter.businessId && booking.businessId?.toString() !== filter.businessId.toString()) {
      throw new ForbiddenException('Not allowed');
    }

    booking.paymentStatus = PaymentStatus.Rejected;
    // We could keep it as PendingPayment or change it
    return booking.save();
  }

  async resendConfirmation(id: string, authUser: AuthUser) {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    const filter = this.buildFilter(authUser);
    if (filter.businessId && booking.businessId?.toString() !== filter.businessId.toString()) {
      throw new ForbiddenException('Not allowed');
    }

    await this.sendConfirmationEmail(booking as Booking);
    return { success: true };
  }
  async getClientDashboardData(email: string, businessId: string) {
    const now = new Date();

    // 1. Get client name from most recent booking
    const recentBooking = await this.bookingModel.findOne({ clientEmail: email, businessId }).sort({ createdAt: -1 }).lean();
    const clientName = recentBooking?.clientName || email.split('@')[0];

    // 2. Get bookings
    const allBookings = await this.bookingModel.find({
      clientEmail: email,
      businessId,
    }).sort({ scheduledAt: -1 }).lean();

    const upcoming = allBookings.filter(b =>
      new Date(b.scheduledAt) >= startOfDay(now) &&
      [BookingStatus.Pending, BookingStatus.Confirmed, BookingStatus.PendingPayment].includes(b.status as BookingStatus)
    ).reverse(); // Sort upcoming by closest first

    const past = allBookings.filter(b =>
      new Date(b.scheduledAt) < startOfDay(now) ||
      b.status === BookingStatus.Cancelled ||
      b.status === BookingStatus.Completed
    );

    // 3. Get active assets (packages/credits)
    const assets = await this.customerAssetsService.findActiveAssets(businessId, email);
    const consumedAssets = await this.customerAssetsService.findRecentlyConsumedAssets(businessId, email);

    return {
      clientName,
      bookings: upcoming,
      pastBookings: past,
      assets,
      consumedAssets
    };
  }
}

