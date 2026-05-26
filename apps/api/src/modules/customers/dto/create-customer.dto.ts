import { ApiProperty } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

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

  @ApiProperty({ example: 299.9 })
  @IsNumber()
  @Min(0)
  monthlyFee: number;

  @ApiProperty({ enum: CustomerStatus, default: CustomerStatus.ATIVO })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
