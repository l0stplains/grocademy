import { ApiProperty } from '@nestjs/swagger';

export class UserItemResDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ name: 'first_name' }) first_name!: string;
  @ApiProperty({ name: 'last_name' }) last_name!: string;
  @ApiProperty() balance!: number;
}

export class UserDetailResDto extends UserItemResDto {
  @ApiProperty() courses_purchased!: number;
}

export class IncrementBalanceResDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() balance!: number;
}
