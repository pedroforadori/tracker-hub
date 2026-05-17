import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../types/current-user.type';

export const CurrentUserDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUser =>
    ctx.switchToHttp().getRequest().user,
);
