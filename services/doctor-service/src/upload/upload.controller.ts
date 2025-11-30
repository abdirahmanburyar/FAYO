import { Controller, Post, UseInterceptors, UploadedFile, Logger, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: '/app/uploads', // Save to the mounted volume
      filename: (req, file, cb) => {
        const randomName = randomUUID();
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
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
    return { url: `/uploads/${file.filename}` };
  }
}

