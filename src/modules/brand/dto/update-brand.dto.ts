import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  image_url?: string;
}
