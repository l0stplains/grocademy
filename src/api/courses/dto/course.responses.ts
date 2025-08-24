import { ApiProperty } from '@nestjs/swagger';

export class CourseItemResDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() instructor!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ type: [String] }) topics!: string[];
  @ApiProperty() price!: number;
  @ApiProperty({ nullable: true }) thumbnail_image!: string | null;
  @ApiProperty() total_modules!: number;
  @ApiProperty() created_at!: string;
  @ApiProperty() updated_at!: string;
  @ApiProperty({ required: false }) is_purchased?: boolean;
}

export class CourseDetailResDto extends CourseItemResDto {}

export class BuyCourseResDto {
  @ApiProperty() course_id!: string;
  @ApiProperty() user_balance!: number;
  @ApiProperty() transaction_id!: string;
}

export class MyCourseItemResDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() instructor!: string;
  @ApiProperty({ type: [String] }) topics!: string[];
  @ApiProperty({ nullable: true }) thumbnail_image!: string | null;
  @ApiProperty() progress_percentage!: number;
  @ApiProperty() purchased_at!: string;
}
