import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class PageAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const res: Response = ctx.switchToHttp().getResponse();

    if (!req.user) {
      res.redirect('/login');
      return false;
    }

    return true;
  }
}
