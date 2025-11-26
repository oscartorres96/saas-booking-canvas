import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';

export interface CreateServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

@Injectable()
export class ServicesService {
  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>) {}

  async create(payload: CreateServicePayload): Promise<Service> {
    const service = new this.serviceModel(payload);
    return service.save();
  }

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find().lean();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).lean();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(id: string, payload: UpdateServicePayload): Promise<Service> {
    const updated = await this.serviceModel
      .findByIdAndUpdate(new Types.ObjectId(id), payload, { new: true })
      .lean();
    if (!updated) {
      throw new NotFoundException('Service not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.serviceModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Service not found');
    }
  }
}
