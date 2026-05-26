import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NovaSenha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'A senha deve conter ao menos uma letra e um número',
  })
  password: string;
}
