import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTrackerDto {
  @ApiProperty({ example: '356938035643809', description: 'IMEI do rastreador (15 dígitos)' })
  @IsString()
  imei: string;

  @ApiProperty({ example: 'TK303' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'Suntech' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'cuid_do_vehicle' })
  @IsString()
  vehicleId: string;
}
