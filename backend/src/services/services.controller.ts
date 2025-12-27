import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ServicesService } from './services.service';
import { StripeSyncService } from '../stripe/stripe-sync.service';

class CreateServiceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  durationMinutes!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  requirePayment?: boolean;

  @IsOptional()
  @IsBoolean()
  requireResource?: boolean;

  @IsOptional()
  @IsBoolean()
  requireProduct?: boolean;

  @IsOptional()
  @IsString()
  businessId?: string;
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  requirePayment?: boolean;

  @IsOptional()
  @IsBoolean()
  requireResource?: boolean;

  @IsOptional()
  @IsBoolean()
  requireProduct?: boolean;

  @IsOptional()
  @IsString()
  businessId?: string;
}

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly stripeSyncService: StripeSyncService,
  ) { }

  @Get()
  findAll(@Req() req: any, @Query('businessId') businessId?: string) {
    return this.servicesService.findAll(req.user ?? { role: 'public' }, businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.findOne(id, req.user ?? { role: 'public' });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateServiceDto, @Req() req: any) {
    return this.servicesService.create(body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateServiceDto, @Req() req: any) {
    return this.servicesService.update(id, body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/stripe/retry')
  async retryStripeSync(@Param('id') id: string) {
    await this.stripeSyncService.syncService(id);
    return { success: true };
  }
}
