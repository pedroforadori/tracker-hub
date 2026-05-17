import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateChipDto {
  @ApiProperty({ example: '89550534000171234567', description: 'ICCID do chip' })
  @IsString()
  iccid: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Vivo', description: 'Operadora do chip' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'cuid_do_tracker' })
  @IsString()
  trackerId: string;
}
