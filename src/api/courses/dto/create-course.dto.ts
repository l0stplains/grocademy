import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

function normalizeTopics(v: any): string[] {
  if (Array.isArray(v)) {
    return v
      .flatMap((x) => String(x).split(','))
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return normalizeTopics(parsed);
    } catch {
      /* noop */
    }
    return v
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export class CreateCourseDto {
  @ApiProperty() @IsString() @MinLength(3) title!: string;
  @ApiProperty() @IsString() @MinLength(10) description!: string;
  @ApiProperty() @IsString() @MinLength(3) instructor!: string;

  @ApiProperty({ type: [String] })
  @Transform(({ value }) => normalizeTopics(value))
  @IsArray()
  topics!: string[];

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price!: number;

  // handled by multipart file: thumbnail_image?: file
}

export class UpdateCourseDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() @MinLength(10) description?: string;
  @IsOptional() @IsString() @MinLength(3) instructor?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : normalizeTopics(value),
  )
  @IsArray()
  topics?: string[];

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  price?: number;
}
