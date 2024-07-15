import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CloudinaryService {
  constructor(private userService: UserService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, user_Id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', type: 'authenticated' },
        (error, result) => {
          if (error) return reject(error);
          this.userService.setProfileImg(user_Id, result.url);
          resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  generateAuthenticatedUrl(publicId: string): string {
    return cloudinary.utils.private_download_url(publicId, 'jpg', {
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // URL expires in 1 hour
    });
  }
}
