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

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  otpToken?: string;
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

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

class LookupBookingDto {
  @IsString()
  clientEmail!: string;

  @IsString()
  accessCode!: string;

  @IsOptional()
  @IsString()
  businessId?: string;
}

class CancelBookingDto {
  @IsString()
  bookingId!: string;

  @IsString()
  clientEmail!: string;

  @IsString()
  accessCode!: string;
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.bookingsService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.findOne(id, req.user);
  }

  @Post()
  create(@Body() body: CreateBookingDto, @Req() req: any) {
    console.log('[DEBUG] Create Booking Body:', JSON.stringify(body));
    return this.bookingsService.create({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    }, req.user ?? { role: 'public' });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBookingDto, @Req() req: any) {
    return this.bookingsService.update(id, {
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    }, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.remove(id, req.user);
  }

  @Post('lookup')
  lookup(@Body() body: LookupBookingDto) {
    return this.bookingsService.findByEmailAndCode(body.clientEmail, body.accessCode, body.businessId);
  }

  @Post('cancel-public')
  cancelPublic(@Body() body: CancelBookingDto) {
    return this.bookingsService.cancelPublic(body.bookingId, body.clientEmail, body.accessCode);
  }

  @Post(':id/confirm-transfer')
  confirmTransfer(@Param('id') id: string, @Body() body: any) {
    return this.bookingsService.confirmPaymentTransfer(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/verify-payment')
  verifyPayment(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.verifyPaymentTransfer(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject-payment')
  rejectPayment(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.rejectPaymentTransfer(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/resend-confirmation')
  resendConfirmation(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.resendConfirmation(id, req.user);
  }
}
