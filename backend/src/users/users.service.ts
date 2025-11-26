import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserPayload {
  email: string;
  password_hash: string;
  name: string;
  role?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: string;
  password_hash?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(payload: CreateUserPayload): Promise<User> {
    const user = new this.userModel(payload);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password_hash').lean();
  }

  async findByEmail(email: string): Promise<User | null> {
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
}
