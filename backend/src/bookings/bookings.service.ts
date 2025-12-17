import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { startOfDay, endOfDay } from 'date-fns';
import { UserRole } from '../users/schemas/user.schema';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { NotificationService } from '../services/notification.service';
import { Service, ServiceDocument } from '../services/schemas/service.schema';

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
    private readonly notificationService: NotificationService
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

    // Evitar doble reserva el mismo dia para el mismo cliente
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
          message: 'Ya tienes una cita para ese dia. Consulta o cancela tu reserva existente.',
          code: 'BOOKING_ALREADY_EXISTS',
          bookingId: existingBooking._id?.toString?.(),
          accessCode: existingBooking.accessCode,
          businessId: existingBooking.businessId,
        });
      }
    }

    // Validar servicio: debe existir y pertenecer al negocio
    const service = await this.serviceModel.findById(payload.serviceId).lean();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.businessId && payload.businessId && service.businessId !== payload.businessId) {
      throw new ForbiddenException('Service does not belong to this business');
    }
    if (service.active === false) {
      throw new ForbiddenException('Service is inactive');
    }

    const booking = new this.bookingModel(payload);
    const savedBooking = await booking.save();

    // Enviar notificaciones por email
    await this.notificationService.sendBookingConfirmation(savedBooking);

    return savedBooking;
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
      (filter.businessId && booking.businessId !== filter.businessId) ||
      (filter.userId && booking.userId !== filter.userId)
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
    }

    return updated;
  }

  async findByEmailAndCode(clientEmail: string, accessCode: string, businessId?: string) {
    const filter: any = {
      clientEmail,
      accessCode,
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
}

