import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProductsService } from './products.service';
import { StripeSyncService } from '../stripe/stripe-sync.service';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly stripeSyncService: StripeSyncService,
    ) { }

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

    @UseGuards(JwtAuthGuard)
    @Post(':id/stripe/retry')
    async retryStripeSync(@Param('id') id: string) {
        await this.stripeSyncService.syncProduct(id);
        return { success: true };
    }
}
