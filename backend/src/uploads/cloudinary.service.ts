import { Injectable } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    async uploadImage(
        file: Express.Multer.File,
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: 'saas-booking-canvas', // Optional: organize in a folder
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                },
            );

            const stream = Readable.from(file.buffer);
            stream.pipe(upload);
        });
    }
}
