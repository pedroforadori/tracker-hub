import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '../common/types/current-user.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from './public.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @ApiOperation({ summary: 'Registrar empresa e administrador' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @ApiOperation({ summary: 'Login e obtenção do token JWT' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  me(@CurrentUserDecorator() user: CurrentUser) {
    return this.auth.getProfile(user);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza nome e/ou senha do usuário autenticado' })
  updateMe(@CurrentUserDecorator() user: CurrentUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user, dto);
  }
}
