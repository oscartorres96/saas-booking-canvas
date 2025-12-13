import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [UploadsController],
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CloudinaryProvider, CloudinaryService],
})
export class UploadsModule { }
