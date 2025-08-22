import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const cookieExtractor = (req: any) => req?.cookies?.token || null;
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'should-be-already-set-in-env#1D$jld)8k',
    });
  }
  async validate(payload: { sub: number; role: 'ADMIN' | 'USER' }) {
    return { id: payload.sub, role: payload.role };
  }
}
