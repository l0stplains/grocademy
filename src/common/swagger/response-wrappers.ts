import {
  ApiExtraModels,
  ApiProperty,
  ApiResponseOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class SuccessResponse<T> {
  @ApiProperty({ example: 'success' }) status: 'success';
  @ApiProperty({ example: '' }) message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ApiProperty({ nullable: true }) data: T | null;
}

export class Paginated<T> {
  @ApiProperty({ example: 1 }) current_page: number;
  @ApiProperty({ example: 10 }) total_pages: number;
  @ApiProperty({ example: 100 }) total_items: number;
}

export class SuccessResponseWithPagination<T> extends SuccessResponse<T> {
  @ApiProperty({ type: Paginated }) pagination!: Paginated<T>;
}

export function ApiOkWrapped<TModel extends Type<unknown>>(
  model: TModel,
  options: Partial<ApiResponseOptions> = {},
) {
  ApiExtraModels(SuccessResponse, model);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp: ApiResponseOptions = {
    ...options,
    status: options.status ?? 200,
    description: options.description ?? 'OK',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(model) },
          },
        },
      ],
    },
  };
  return resp;
}

export function ApiOkPaginated<TModel extends Type<unknown>>(
  model: TModel,
  options: Partial<ApiResponseOptions> = {},
) {
  ApiExtraModels(SuccessResponseWithPagination, model, Paginated);
  const resp: ApiResponseOptions = {
    ...options,
    status: options.status ?? 200,
    description: options.description ?? 'OK (paginated)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseWithPagination) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(model) },
            },
            pagination: { $ref: getSchemaPath(Paginated) },
          },
        },
      ],
    },
  };
  return resp;
}
