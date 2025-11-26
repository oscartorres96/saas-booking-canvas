import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BusinessesService } from './businesses.service';

@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.businessesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.businessesService.findOne(id, req.user);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.businessesService.create(body, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.businessesService.update(id, body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.businessesService.remove(id, req.user);
  }
}
