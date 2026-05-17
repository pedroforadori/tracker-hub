import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Transportes Silva Ltda' })
  @IsString()
  name: string;

  @ApiProperty({ example: '12345678000195', description: 'CNPJ sem formatação (14 dígitos)' })
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  cnpj: string;

  @ApiProperty({ example: 'contato@transportessilva.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  phone: string;
}
