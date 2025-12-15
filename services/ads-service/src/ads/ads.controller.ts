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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';


@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Body() createAdDto: CreateAdDto) {
    return this.adsService.create(createAdDto);
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
  update(@Param('id') id: string, @Body() updateAdDto: UpdateAdDto) {
    return this.adsService.update(id, updateAdDto);
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

