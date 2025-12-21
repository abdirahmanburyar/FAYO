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
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { PaymentMethod } from '../payments/dto/create-payment.dto';

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

  // IMPORTANT: This route must be defined BEFORE @Get(':id') to avoid route conflicts
  @Get('calculate-fee')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  calculateFee(
    @Query('range') range: string,
    @Query('price') price: string,
  ) {
    const rangeNum = parseInt(range, 10);
    const priceNum = parseFloat(price); // Price comes in as dollars
    
    if (isNaN(rangeNum) || rangeNum < 0) {
      throw new BadRequestException('Invalid range. Must be 0 or a positive number.');
    }
    
    if (isNaN(priceNum) || priceNum < 0) {
      throw new BadRequestException('Invalid price. Must be 0 or a positive number.');
    }
    
    const fee = this.adsService.calculateAdFee(rangeNum, priceNum);
    return {
      range: rangeNum,
      price: priceNum, // price per day in dollars
      fee, // total fee in cents (price × range)
      feeInDollars: (fee / 100).toFixed(2),
    };
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

  @Post(':id/pay')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async payForAd(
    @Param('id') id: string,
    @Body() paymentData: {
      paymentMethod: PaymentMethod;
      paidBy?: string;
      processedBy?: string;
      notes?: string;
      transactionId?: string;
    },
  ) {
    return this.adsService.payForAd(id, paymentData);
  }
}

