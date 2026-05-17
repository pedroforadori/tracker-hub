import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  plate: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Hilux' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 'cuid_do_customer' })
  @IsString()
  customerId: string;
}
