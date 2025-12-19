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
    ) {
        return this.assetsService.findActiveAssets(businessId, email, serviceId);
    }
}
