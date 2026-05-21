import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CheckoutWelcomeDto {
  @ApiProperty({ example: 'cliente@empresa.com' })
  @IsEmail()
  email: string;
}
