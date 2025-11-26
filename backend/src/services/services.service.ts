import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../users/schemas/user.schema';
import { Service, ServiceDocument } from './schemas/service.schema';

export interface CreateServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

interface AuthUser {
  userId: string;
  role: string;
  businessId?: string;
}

@Injectable()
export class ServicesService {
  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>) {}

  private buildFilter(authUser: AuthUser) {
    if (authUser.role === UserRole.Owner) return {};
    if (authUser.role === UserRole.Business) {
      if (!authUser.businessId) throw new ForbiddenException('Business context missing');
      return { businessId: authUser.businessId };
    }
    if (authUser.role === UserRole.Client) throw new ForbiddenException('Not allowed');
    return {};
  }

  async create(payload: CreateServicePayload, authUser: AuthUser): Promise<Service> {
    if (authUser.role === UserRole.Client) {
      throw new ForbiddenException('Not allowed');
    }
    if (authUser.role === UserRole.Business) {
      if (!authUser.businessId) throw new ForbiddenException('Business context missing');
      payload.businessId = authUser.businessId;
    }
    const service = new this.serviceModel(payload);
    return service.save();
  }

  async findAll(authUser: AuthUser): Promise<Service[]> {
    return this.serviceModel.find(this.buildFilter(authUser)).lean();
  }

  async findOne(id: string, authUser: AuthUser): Promise<Service> {
    const service = await this.serviceModel.findOne({ _id: new Types.ObjectId(id), ...this.buildFilter(authUser) }).lean();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(id: string, payload: UpdateServicePayload, authUser: AuthUser): Promise<Service> {
    if (authUser.role === UserRole.Client) {
      throw new ForbiddenException('Not allowed');
    }
    const updated = await this.serviceModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), ...this.buildFilter(authUser) },
      payload,
      { new: true },
    ).lean();
    if (!updated) {
      throw new NotFoundException('Service not found');
    }
    return updated;
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    if (authUser.role === UserRole.Client) {
      throw new ForbiddenException('Not allowed');
    }
    const result = await this.serviceModel.findOneAndDelete({ _id: new Types.ObjectId(id), ...this.buildFilter(authUser) });
    if (!result) {
      throw new NotFoundException('Service not found');
    }
  }
}
