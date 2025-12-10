import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `logo-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    }
  }))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new Error('File upload failed');
    }
    // Update logoUrl in business settings
    // Assuming the backend serves static files from /uploads
    const apiUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    const logoUrl = `${apiUrl}/uploads/${file.filename}`;

    await this.businessesService.updateSettings(id, { logoUrl }, req.user);
    return { url: logoUrl };
  }
}
