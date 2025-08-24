import { ApiProperty } from '@nestjs/swagger';

export class LoginResDto {
  @ApiProperty() username!: string;
  @ApiProperty() token!: string;
  @ApiProperty({ example: false }) is_admin!: boolean;
}

export class RegisterResDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty({ name: 'first_name' }) first_name!: string;
  @ApiProperty({ name: 'last_name' }) last_name!: string;
}

export class SelfResDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ name: 'first_name' }) first_name!: string;
  @ApiProperty({ name: 'last_name' }) last_name!: string;
  @ApiProperty() balance!: number;
}
