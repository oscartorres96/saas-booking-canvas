import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
      role: 'user',
    });

    return this.buildAuthResponse(user as UserDocument);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user as UserDocument);
  }

  private buildAuthResponse(user: UserDocument): AuthResponse {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwtSecret'),
      expiresIn: this.configService.get<string>('jwtExpiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwtSecret'),
      expiresIn: this.configService.get<string>('jwtRefreshExpiresIn'),
    });
    const safeUser = user.toObject();
    delete (safeUser as Record<string, unknown>).password_hash;

    return { accessToken, refreshToken, user: safeUser };
  }
}
