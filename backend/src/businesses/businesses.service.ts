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
  address?: string;
  logoUrl?: string;
  ownerUserId: string;
}

interface UpdateBusinessDto {
  name?: string;
  address?: string;
  logoUrl?: string;
}

@Injectable()
export class BusinessesService {
  constructor(@InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>) {}

  private assertAccess(authUser: AuthUser, business: BusinessDocument) {
    if (authUser.role === UserRole.Owner) return;
    if (authUser.role === UserRole.Business && authUser.userId === business.ownerUserId) return;
    throw new ForbiddenException('Not allowed');
  }

  async create(payload: CreateBusinessDto, authUser: AuthUser) {
    if (authUser.role !== UserRole.Owner) {
      throw new ForbiddenException('Only owners can create businesses');
    }
    const business = new this.businessModel(payload);
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
    Object.assign(business, payload);
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
