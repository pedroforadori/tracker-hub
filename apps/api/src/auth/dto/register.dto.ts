import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'A senha deve conter ao menos uma letra e um número',
  })
  password: string;

  @ApiProperty({ example: 'Empresa XYZ Ltda' })
  @IsString()
  @MinLength(2)
  tenantName: string;
}
