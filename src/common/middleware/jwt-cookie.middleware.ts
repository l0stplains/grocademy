import { Injectable, NestMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtCookieMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    const token = req.cookies?.token;
    if (token) {
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || 'should-be-already-set-in-env#1D$jld)8k',
        ) as any;
        req.user = {
          id: payload.sub,
          role: payload.role,
          username: payload.username,
        };
      } catch {
        /* ignore invalid token */
      }
    }
    next();
  }
}
