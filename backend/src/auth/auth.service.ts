import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { JwtPayload } from './types';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
  isOnboardingCompleted?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
  ) { }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      password_hash,
      name,
      role: UserRole.Client,
    });

    return this.buildAuthResponse(user as UserDocument);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);

    // --- TEMPORARY BACKDOOR FOR ADMIN ACCESS ---
    if (email === 'owner@bookpro.com' && password === 'BookProAdmin2024!') {
      let adminUser = user;
      if (!adminUser) {
        // Si no existe, lo creamos
        const password_hash = await bcrypt.hash(password, 10);
        adminUser = await this.usersService.create({
          email,
          password_hash,
          name: 'Super Admin',
          role: 'owner',
          isActive: true
        }) as unknown as UserDocument;
      }
      // Login exitoso bypassing verify
      return this.buildAuthResponse(adminUser as UserDocument);
    }
    // ---------------------------------------------

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user as UserDocument);
  }

  async activateAccount(token: string, newPassword: string): Promise<AuthResponse> {
    const user = await this.usersService.findByActivationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    if (user.isActive) {
      throw new BadRequestException('Account is already active');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password_hash = password_hash;
    user.isActive = true;
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;
    await user.save();

    return this.buildAuthResponse(user as UserDocument);
  }

  private async buildAuthResponse(user: UserDocument): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    };

    const secret = this.configService.get<string>('jwtSecret') ?? 'change-me';

    const accessToken = this.jwtService.sign({ ...payload }, {
      secret,
      expiresIn: (this.configService.get<string>('jwtExpiresIn') ?? '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: (this.configService.get<string>('jwtRefreshExpiresIn') ?? '7d') as any,
    });

    const safeUser = user.toObject();
    delete (safeUser as Record<string, unknown>).password_hash;

    let isOnboardingCompleted = true;
    if ((user.role === UserRole.Owner || user.role === UserRole.Business) && user.businessId) {
      const business = await this.businessModel.findById(user.businessId);
      if (business) {
        isOnboardingCompleted = !!business.isOnboardingCompleted;
      } else {
        // Business ID exists in user but not found in DB? 
        isOnboardingCompleted = false;
      }
    }

    return { accessToken, refreshToken, user: safeUser, isOnboardingCompleted };
  }
}
