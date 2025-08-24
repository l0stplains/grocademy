import { ApiProperty } from '@nestjs/swagger';

export class PollVersionResDto {
  @ApiProperty() version!: number;
  @ApiProperty({ required: false }) changed?: boolean;
}
