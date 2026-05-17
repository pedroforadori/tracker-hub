import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
