import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BusinessesService, CreateBusinessResult } from './businesses.service';
import { CloudinaryService } from '../uploads/cloudinary.service';

@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Get()
  findAll(@Req() req: any) {
    return this.businessesService.findAll(req.user ?? { role: 'public' });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string, @Req() req: any) {
    return this.businessesService.findBySlug(slug, req.user ?? { role: 'public', userId: 'system' });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.businessesService.findOne(id, req.user ?? { role: 'public' });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any, @Req() req: any): Promise<CreateBusinessResult> {
    return this.businessesService.create(body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.businessesService.update(id, body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/settings')
  async updateSettings(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.businessesService.updateSettings(id, body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/onboarding')
  updateOnboarding(
    @Param('id') id: string,
    @Body() body: { step: number; isCompleted?: boolean },
    @Req() req: any
  ) {
    return this.businessesService.updateOnboarding(id, body.step, !!body.isCompleted, req.user);
  }

  @Get(':id/slots')
  async getSlots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('service') serviceId: string,
  ) {
    return this.businessesService.getSlots(id, date, serviceId);
  }

  @Get(':id/booking-settings')
  async getBookingSettings(@Param('id') id: string, @Req() req: any) {
    const business = await this.businessesService.findOne(id, req.user ?? { role: 'public' });
    return {
      bookingViewMode: business.bookingConfig?.bookingViewMode || 'CALENDAR',
      weekHorizonDays: business.bookingConfig?.weekHorizonDays || 14,
      weekStart: business.bookingConfig?.weekStart || 'CURRENT',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/booking-settings')
  async updateBookingSettings(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.businessesService.updateSettings(id, { bookingConfig: body }, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/payment-config')
  updatePaymentConfig(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.businessesService.updatePaymentConfig(id, body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.businessesService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new Error('File upload failed');
    }

    try {
      const result = await this.cloudinaryService.uploadImage(file) as any;
      const logoUrl = result.secure_url;

      await this.businessesService.updateSettings(id, { logoUrl }, req.user);
      return { url: logoUrl };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Image upload failed');
    }
  }
}
