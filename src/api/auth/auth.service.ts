import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private signToken(user: {
    id: number;
    role: 'ADMIN' | 'USER';
    username: string;
  }) {
    const token = jwt.sign(
      { sub: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'should-be-already-set-in-env#1D$jld)8k',
      { expiresIn: '1h' },
    );
    return token;
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException(
        'password and confirm_password do not match',
      );
    }
    try {
      const hash = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hash,
          role: 'USER',
          balance: 0,
        },
      });
      return {
        id: String(user.id),
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
      };
    } catch (e: any) {
      if (e.code === 'P2002') {
        // unique constraint violation
        const target = e.meta?.target?.[0] || 'field';
        throw new ConflictException(`${target} already exists`);
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = this.signToken({
      id: user.id,
      role: user.role as any,
      username: user.username,
    });
    return { username: user.username, token };
  }

  async self(userId: number) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new UnauthorizedException();
    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      balance: u.balance,
    };
  }
}
