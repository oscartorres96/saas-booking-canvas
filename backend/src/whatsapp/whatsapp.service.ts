import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
    private readonly waToken: string;
    private readonly waPhoneNumberId: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.waToken = this.configService.get<string>('WA_TOKEN') || '';
        this.waPhoneNumberId = this.configService.get<string>('WA_PHONE_NUMBER_ID') || '';

        if (!this.waToken || !this.waPhoneNumberId) {
            console.warn('WhatsApp credentials not found in environment variables');
        }
    }

    async sendTemplateMessage(to: string, template: string, variables: string[], languageCode: string = 'es_MX') {
        const url = `https://graph.facebook.com/v17.0/${this.waPhoneNumberId}/messages`;

        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: template,
                language: { code: languageCode },
                components: [
                    {
                        type: 'body',
                        parameters: variables.map((variable) => ({
                            type: 'text',
                            text: variable,
                        })),
                    },
                ],
            },
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(url, body, {
                    headers: {
                        Authorization: `Bearer ${this.waToken}`,
                        'Content-Type': 'application/json',
                    },
                }),
            );
            return response.data;
        } catch (error: any) {
            // Log the full error for debugging
            console.error('WhatsApp API Error:', error.response?.data || error.message);
            throw new InternalServerErrorException(
                error.response?.data || 'Error sending WhatsApp message',
            );
        }
    }
}
