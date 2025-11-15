import { ApiProperty } from '@nestjs/swagger';

export class Specialty {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Specialty name' })
  name: string;

  @ApiProperty({ description: 'Specialty description', required: false })
  description?: string;


  @ApiProperty({ description: 'Whether the specialty is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
