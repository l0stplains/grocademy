import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  Body,
  Post,
  Put,
  Delete,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { IncrementBalanceDto } from './dto/increment-balance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('api/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
  ) {
    const { items, pagination } = await this.users.list(
      q,
      Number(page),
      Number(limit),
    );
    // use __raw to preserve {status, data, pagination} at top-level
    // see { @link src/common/interceptors/response.interceptor.ts }
    return {
      __raw: true,
      payload: { status: 'success', message: '', data: items, pagination },
    };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const data = await this.users.getById(id);
    return { data };
  }

  @Post(':id/balance')
  async inc(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: IncrementBalanceDto,
  ) {
    const data = await this.users.incrementBalance(id, body.increment);
    return { message: 'balance updated', data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.users.update(id, dto);
    return { message: 'updated', data };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() me: { id: number },
    @Res() res: Response,
  ) {
    await this.users.remove(id, me.id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}
