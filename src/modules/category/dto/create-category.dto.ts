import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUrl()
  icon?: string | null;
}
