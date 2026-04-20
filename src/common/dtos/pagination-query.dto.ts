import { IsString, IsOptional, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Matches(/^\d+$/, { message: 'page must be a positive number' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Matches(/^\d+$/, { message: 'limit must be a positive number' })
  limit?: number = 10;
}