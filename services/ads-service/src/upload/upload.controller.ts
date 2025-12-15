import { Controller, Post, UseInterceptors, UploadedFile, Logger, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadsPath = process.env.UPLOADS_PATH || process.cwd();
        const adsPath = join(uploadsPath, 'uploads', 'ads');
        // Ensure directory exists
        if (!existsSync(adsPath)) {
          mkdirSync(adsPath, { recursive: true });
        }
        cb(null, adsPath);
      },
      filename: (req, file, cb) => {
        const randomName = randomUUID();
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    this.logger.log(`File uploaded: ${file.filename}`);
    // Return the URL where the file can be accessed
    return { url: `/uploads/ads/${file.filename}` };
  }
}

