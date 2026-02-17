import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationService } from './notification.service';
import { IsString, IsOptional, IsEmail } from 'class-validator';

class SendReminderDto {
    @IsEmail()
    to!: string;

    @IsString()
    clientName!: string;

    @IsString()
    message!: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsString()
    ctaUrl?: string;
}

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) { }

    @UseGuards(JwtAuthGuard)
    @Post('send-reminder')
    async sendReminder(@Body() body: SendReminderDto, @Req() req: any) {
        // En un entorno real, verificaríamos que el usuario sea el dueño del negocio
        // Para este MVP, asumimos que el businessId viene del token o lo pasamos en el body
        // Como no tenemos el businessId en el body del DTO actual, lo sacamos de req.user

        const businessId = req.user.businessId;

        if (!businessId) {
            throw new Error('Business ID not found in token');
        }

        await this.notificationService.sendCustomReminderEmail({
            ...body,
            businessId,
        });

        return { success: true, message: 'Email sent successfully' };
    }
}
