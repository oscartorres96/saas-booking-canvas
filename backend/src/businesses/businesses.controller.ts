import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BusinessesService, CreateBusinessResult } from './businesses.service';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) { }

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

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.businessesService.remove(id, req.user);
  }
}
