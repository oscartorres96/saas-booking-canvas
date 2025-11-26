import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';

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
}

export type UpdateBookingPayload = Partial<CreateBookingPayload>;

@Injectable()
export class BookingsService {
  constructor(@InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>) {}

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const booking = new this.bookingModel(payload);
    return booking.save();
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingModel.find().lean();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).lean();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async update(id: string, payload: UpdateBookingPayload): Promise<Booking> {
    const updated = await this.bookingModel
      .findByIdAndUpdate(new Types.ObjectId(id), payload, { new: true })
      .lean();
    if (!updated) {
      throw new NotFoundException('Booking not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.bookingModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Booking not found');
    }
  }
}
