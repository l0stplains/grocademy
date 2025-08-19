import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/create-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

function pdfOrVideoFilter(_req: any, file: Express.Multer.File, cb: Function) {
  if (file.fieldname === 'pdf_content') {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('pdf_content must be a PDF'), false);
  }
  if (file.fieldname === 'video_content') {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('video_content must be a video'), false);
  }
  return cb(null, true);
}

@ApiTags('Modules')
@Controller()
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Post('api/courses/:courseId/modules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pdf_content', maxCount: 1 },
        { name: 'video_content', maxCount: 1 },
      ],
      { fileFilter: pdfOrVideoFilter, limits: { fileSize: 100 * 1024 * 1024 } },
    ),
  )
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateModuleDto,
    @UploadedFiles()
    files: {
      pdf_content?: Express.Multer.File[];
      video_content?: Express.Multer.File[];
    },
  ) {
    const data = await this.modules.create(courseId, dto, {
      pdf_content: files?.pdf_content?.[0],
      video_content: files?.video_content?.[0],
    });

    return { message: 'created', data };
  }

  @Get('api/courses/:courseId/modules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
  ) {
    const { items, pagination } = await this.modules.list(
      courseId,
      Number(page),
      Number(limit),
      user,
    );
    return {
      __raw: true,
      payload: { status: 'success', message: '', data: items, pagination },
    };
  }

  @Get('api/modules/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
  ) {
    const data = await this.modules.getById(id, user);
    return { message: '', data };
  }

  @Put('api/modules/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pdf_content', maxCount: 1 },
        { name: 'video_content', maxCount: 1 },
      ],
      { fileFilter: pdfOrVideoFilter, limits: { fileSize: 100 * 1024 * 1024 } },
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuleDto,
    @UploadedFiles()
    files: {
      pdf_content?: Express.Multer.File[];
      video_content?: Express.Multer.File[];
    },
  ) {
    const data = await this.modules.update(id, dto, {
      pdf_content: files?.pdf_content?.[0],
      video_content: files?.video_content?.[0],
    });
    return { message: 'updated', data };
  }

  @Delete('api/modules/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.modules.remove(id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  @Patch('api/courses/:courseId/modules/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reorder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: ReorderModulesDto,
  ) {
    const arr = await this.modules.reorder(courseId, body.module_order);
    return { message: 'reordered', data: { module_order: arr } };
  }
}
