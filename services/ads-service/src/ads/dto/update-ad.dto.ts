import { PartialType } from '@nestjs/mapped-types';
import { CreateAdDto } from './create-ad.dto';
import { IsOptional, IsInt, Min } from 'class-validator';

export class UpdateAdDto extends PartialType(CreateAdDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  clickCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  viewCount?: number;
}

