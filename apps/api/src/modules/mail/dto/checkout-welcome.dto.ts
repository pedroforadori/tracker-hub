import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckoutWelcomeDto {
  @ApiProperty({
    example: 'cs_test_a1B2c3D4e5F6...',
    description: 'ID da sessão de checkout do Stripe (validada internamente antes do envio do e-mail)',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
