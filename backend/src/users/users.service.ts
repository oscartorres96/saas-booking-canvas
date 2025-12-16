import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserPayload {
  email: string;
  password_hash: string;
  name: string;
  role?: string;
  businessId?: string;
  isActive?: boolean;
  activationToken?: string;
  activationTokenExpires?: Date;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  role?: string;
  password_hash?: string;
  businessId?: string;
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) { }

  async create(payload: CreateUserPayload): Promise<UserDocument> {
    const user = new this.userModel(payload);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password_hash').lean();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password_hash').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    if (payload.password) {
      payload.password_hash = await (await import('bcrypt')).hash(payload.password, 10);
      delete payload.password;
    }
    const updated = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), payload, { new: true })
      .select('-password_hash')
      .lean();
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id);
    if (!res) {
      throw new NotFoundException('User not found');
    }
  }

  async findByActivationToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      activationToken: token,
      activationTokenExpires: { $gt: new Date() }
    }).exec();
  }
}
