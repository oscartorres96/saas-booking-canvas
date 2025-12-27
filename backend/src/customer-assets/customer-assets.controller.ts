import { Controller, Get, Query, Param } from '@nestjs/common';
import { CustomerAssetsService } from './customer-assets.service';

@Controller('customer-assets')
export class CustomerAssetsController {
    constructor(private readonly assetsService: CustomerAssetsService) { }

    @Get('active')
    async findActive(
        @Query('businessId') businessId: string,
        @Query('email') email: string,
        @Query('serviceId') serviceId?: string,
        @Query('phone') phone?: string,
    ) {
        return this.assetsService.findActiveAssets(businessId, email, serviceId, phone);
    }

    @Get('by-business/:businessId')
    async findByBusiness(@Param('businessId') businessId: string) {
        return this.assetsService.findByBusiness(businessId);
    }
}
