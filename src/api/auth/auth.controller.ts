import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ApiOkWrapped } from '../../common/swagger/response-wrappers';
import { LoginResDto, RegisterResDto, SelfResDto } from './dto/auth.responses';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@ApiExtraModels(LoginResDto, RegisterResDto, SelfResDto)
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiResponse(ApiOkWrapped(RegisterResDto))
  async register(@Body() dto: RegisterDto) {
    const data = await this.auth.register(dto);
    return { message: 'registered', data };
  }

  @Post('login')
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse(
    ApiOkWrapped(LoginResDto, {
      description: 'Sets HttpOnly cookie "token" and returns token as well.',
    }),
  )
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.auth.login(dto);
    return { message: 'ok', data };
  }

  @Get('self')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('token')
  @ApiBearerAuth('bearer')
  @ApiResponse(ApiOkWrapped(SelfResDto))
  async self(@CurrentUser() user: { id: number }) {
    const data = await this.auth.self(user.id);
    return { message: '', data };
  }
}
