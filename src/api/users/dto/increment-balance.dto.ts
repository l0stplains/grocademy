import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

// Dev note: idk if decrement needed specifically
export class IncrementBalanceDto {
  @ApiProperty() @IsNumber() increment!: number;
}
