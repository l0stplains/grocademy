import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'email or username' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty() @IsString() @IsNotEmpty() password!: string;
}
