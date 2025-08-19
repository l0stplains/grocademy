import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

class ModuleOrderItem {
  @IsInt() @Min(1) id!: number;
  @IsInt() @Min(1) order!: number;
}

export class ReorderModulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ModuleOrderItem)
  module_order!: ModuleOrderItem[];
}
