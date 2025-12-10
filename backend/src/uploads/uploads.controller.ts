import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('uploads')
export class UploadsController {
    @Get(':filename')
    serveFile(@Param('filename') filename: string, @Res() res: Response) {
        res.sendFile(join(process.cwd(), 'uploads', filename));
    }
}
