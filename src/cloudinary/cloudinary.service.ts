import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary.response';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  constructor() {
    console.log('CLOUDINARY CALLED');
  }

  uploadPhoto(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream();
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nest-users',
          width: 150,
          crop: 'scale',
        },
        (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deletePhoto(photo_id: string): Promise<void> {
    await cloudinary.uploader.destroy(photo_id);
  }
}
