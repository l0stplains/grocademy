import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsString() @MinLength(3) title!: string;
  @IsString() @MinLength(5) description!: string;
  @ApiPropertyOptional({
    description: 'Optional explicit order; if omitted, will append to end',
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  order?: number;

  // files: pdf_content, video_content (multipart)
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'PDF maximum 100MB',
  })
  @IsOptional()
  pdf_content?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Video maximum 100MB',
  })
  @IsOptional()
  video_content?: Express.Multer.File;
}

export class UpdateModuleDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() @MinLength(5) description?: string;
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  order?: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'PDF maximum 100MB',
  })
  @IsOptional()
  pdf_content?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Video maximum 100MB',
  })
  @IsOptional()
  video_content?: Express.Multer.File;
}
