import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get('business/:businessId')
    async findAll(@Param('businessId') businessId: string) {
        return this.productsService.findAll(businessId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Req() req: any, @Body() body: any) {
        return this.productsService.create(req.user.businessId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.productsService.update(id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
