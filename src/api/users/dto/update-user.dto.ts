import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;
  @ApiPropertyOptional({ name: 'first_name' })
  @Expose({ name: 'first_name' })
  @IsOptional()
  @IsString()
  firstName?: string;
  @ApiPropertyOptional({ name: 'last_name' })
  @Expose({ name: 'last_name' })
  @IsOptional()
  @IsString()
  lastName?: string;
  @ApiPropertyOptional({ description: 'min 8 chars, letters+numbers' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
