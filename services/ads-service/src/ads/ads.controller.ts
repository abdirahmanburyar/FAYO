import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/ads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `ad-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const imagePath = `/uploads/ads/${file.filename}`;
    const body = req.body;
    return this.adsService.create({
      company: body.company,
      image: imagePath,
      startDate: body.startDate,
      range: parseInt(body.range, 10),
      status: body.status,
      createdBy: body.createdBy,
    });
  }

  @Get()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adsService.findAll(activeOnly === 'true', pageNum, limitNum);
  }

  @Get('active')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  findActive(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adsService.findActive(pageNum, limitNum);
  }

  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/ads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `ad-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    const body = req.body;
    const updateData: UpdateAdDto = {};
    
    if (file) {
      updateData.image = `/uploads/ads/${file.filename}`;
    }
    if (body.company) {
      updateData.company = body.company;
    }
    if (body.startDate) {
      updateData.startDate = body.startDate;
    }
    if (body.range) {
      updateData.range = parseInt(body.range, 10);
    }
    if (body.status) {
      updateData.status = body.status;
    }
    
    return this.adsService.update(id, updateData);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(@Param('id') id: string) {
    return this.adsService.remove(id);
  }

  @Post(':id/view')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  incrementView(@Param('id') id: string) {
    return this.adsService.incrementViewCount(id);
  }

  @Post(':id/click')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  incrementClick(@Param('id') id: string) {
    return this.adsService.incrementClickCount(id);
  }
}

