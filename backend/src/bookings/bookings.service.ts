import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../users/schemas/user.schema';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';

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
  constructor(@InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>) { }

  private buildFilter(authUser: AuthUser) {
    if (authUser.role === UserRole.Owner) return {};
    if (authUser.role === UserRole.Business) {
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
    const booking = new this.bookingModel(payload);
    return booking.save();
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
    const updated = await this.bookingModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), ...this.buildFilter(authUser) },
        payload,
        { new: true },
      )
      .lean();
    if (!updated) {
      throw new NotFoundException('Booking not found');
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
    return booking.save();
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const result = await this.bookingModel.findOneAndDelete({ _id: new Types.ObjectId(id), ...this.buildFilter(authUser) });
    if (!result) {
      throw new NotFoundException('Booking not found');
    }
  }
}
