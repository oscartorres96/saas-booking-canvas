import { Body, Controller, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Post('send')
    async sendTemplateMessage(
        @Body() body: { to: string; template: string; variables: string[]; language?: string },
    ) {
        return this.whatsappService.sendTemplateMessage(
            body.to,
            body.template,
            body.variables,
            body.language,
        );
    }
}
