import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../users/schemas/user.schema';
import { Business, BusinessDocument } from './schemas/business.schema';

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
  ownerUserId: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  type?: string;
  subscriptionStatus?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateBusinessDto extends Partial<CreateBusinessDto> {}

@Injectable()
export class BusinessesService {
  constructor(@InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>) {}

  private assertAccess(authUser: AuthUser, business: BusinessDocument) {
    if (!authUser?.role || authUser.role === 'public') return;
    if (authUser.role === UserRole.Owner) return;
    if (authUser.role === UserRole.Business) {
      if (authUser.userId === business.ownerUserId) return;
      if (authUser.businessId && authUser.businessId.toString() === business.id.toString()) return;
    }
    throw new ForbiddenException('Not allowed');
  }

  async create(payload: CreateBusinessDto, authUser: AuthUser) {
    if (authUser.role !== UserRole.Owner) {
      throw new ForbiddenException('Only owners can create businesses');
    }
    const business = new this.businessModel({
      ...payload,
      businessName: payload.businessName ?? payload.name,
    });
    return business.save();
  }

  async findAll(authUser: AuthUser) {
    if (authUser.role === UserRole.Owner) {
      return this.businessModel.find().lean();
    }
    if (authUser.role === UserRole.Business) {
      return this.businessModel.find({ ownerUserId: authUser.userId }).lean();
    }
    throw new ForbiddenException('Not allowed');
  }

  async findOne(id: string, authUser: AuthUser) {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    this.assertAccess(authUser, business);
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
}
