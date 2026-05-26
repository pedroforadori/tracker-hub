import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PlanStatus, UserRole } from '@prisma/client';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import { BillingService } from '../modules/billing/billing.service';
import { CurrentUser } from '../common/types/current-user.type';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private billing: BillingService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const activated = await (super.canActivate(context) as Promise<boolean>);
    if (!activated) return false;

    const req = context.switchToHttp().getRequest();
    const user: CurrentUser = req.user;

    // Billing check is skipped for billing endpoints to avoid bootstrap problems
    if (req.path?.startsWith('/billing')) return true;

    const billing = await this.billing.getBillingStatusCached(user.tenantId);
    if (!billing) return true;

    const { planStatus, blockReason, gracePeriodEndsAt } = billing;

    // Grace period expired — promote to BLOCKED asynchronously (fire-and-forget)
    // and block this request immediately. The guard intentionally does not write
    // to the DB directly; promotion is delegated to BillingService.
    if (planStatus === PlanStatus.PAST_DUE && gracePeriodEndsAt && gracePeriodEndsAt < new Date()) {
      void this.billing.promoteExpiredToBlocked(user.tenantId);
      this.throwBlocked(user.role, blockReason);
    }

    if (planStatus === PlanStatus.BLOCKED) {
      this.throwBlocked(user.role, blockReason);
    }

    // Grace period still active — allow but signal via response headers
    if (planStatus === PlanStatus.PAST_DUE && gracePeriodEndsAt) {
      const res = context.switchToHttp().getResponse();
      res.setHeader('x-payment-warning', 'true');
      res.setHeader('x-grace-period-ends', gracePeriodEndsAt.toISOString());
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) throw new UnauthorizedException('Token JWT inválido ou ausente');
    return user as TUser;
  }

  private throwBlocked(role: UserRole, blockReason: string | null): never {
    const message =
      role === UserRole.ADMIN
        ? `Pagamento falhou: ${blockReason ?? 'entre em contato com o suporte'}. Atualize seu cartão para retomar o acesso.`
        : 'Acesso bloqueado, contate o administrador da conta.';
    throw new PaymentRequiredException(message);
  }
}
