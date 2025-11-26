import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BookingsService } from './bookings.service';

class CreateBookingDto {
  @IsString()
  clientName!: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateBookingDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.bookingsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.findOne(id, req.user);
  }

  @Post()
  create(@Body() body: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.create({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    }, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBookingDto, @Req() req: any) {
    return this.bookingsService.update(id, {
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    }, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.remove(id, req.user);
  }
}
