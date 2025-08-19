import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private toPublic(u: any) {
    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      balance: u.balance,
    };
  }

  async list(q: string | undefined, page = 1, limit = 15) {
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({ where, skip, take, orderBy: { id: 'asc' } }),
    ]);

    return {
      items: rows.map(this.toPublic),
      pagination: {
        current_page: Math.max(page, 1),
        total_pages: Math.max(1, Math.ceil(total / take)),
        total_items: total,
      },
    };
  }

  async getById(id: number) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return this.toPublic(u);
  }

  async incrementBalance(id: number, amount: number) {
    if (!Number.isFinite(amount))
      throw new BadRequestException('increment must be a number');
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { balance: u.balance + amount },
    });
    return {
      id: String(updated.id),
      username: updated.username,
      balance: updated.balance,
    };
  }

  async update(
    id: number,
    dto: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
    },
  ) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    if (u.role === 'ADMIN')
      throw new ForbiddenException('Admin account cannot be modified');

    const data: any = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.toPublic(updated);
  }

  async remove(id: number, actingUserId: number) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN')
      throw new ForbiddenException('Admin account cannot be deleted');
    if (target.id === actingUserId)
      throw new ForbiddenException('You cannot delete yourself');

    await this.prisma.user.delete({ where: { id } });
  }
}
