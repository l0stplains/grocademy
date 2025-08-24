import { ApiProperty } from '@nestjs/swagger';

export class ModuleResDto {
  @ApiProperty() id!: string;
  @ApiProperty({ name: 'course_id' }) course_id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() order!: number;
  @ApiProperty({ nullable: true, name: 'pdf_content' }) pdf_content!:
    | string
    | null;
  @ApiProperty({ nullable: true, name: 'video_content' }) video_content!:
    | string
    | null;
  @ApiProperty({ name: 'is_completed' }) is_completed!: boolean;
  @ApiProperty({ required: false, name: 'created_at' }) created_at?: string;
  @ApiProperty({ required: false, name: 'updated_at' }) updated_at?: string;
}

export class ReorderPairResDto {
  @ApiProperty() id!: string;
  @ApiProperty() order!: number;
}

export class ReorderListDataResDto {
  @ApiProperty({ type: [ReorderPairResDto] })
  items!: ReorderPairResDto[];
}

// completion
export class CourseProgressResDto {
  @ApiProperty({ name: 'total_modules' }) total_modules!: number;
  @ApiProperty({ name: 'completed_modules' }) completed_modules!: number;
  @ApiProperty() percentage!: number;
}

export class CompleteResDto {
  @ApiProperty({ name: 'module_id' }) module_id!: string;
  @ApiProperty({ name: 'is_completed' }) is_completed!: true;
  @ApiProperty({ name: 'course_progress', type: CourseProgressResDto })
  course_progress!: CourseProgressResDto;
  @ApiProperty({ nullable: true, name: 'certificate_url' }) certificate_url!:
    | string
    | null;
}
