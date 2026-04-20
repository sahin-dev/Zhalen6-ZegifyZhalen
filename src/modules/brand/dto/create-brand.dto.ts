import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUrl()
  image_url?: string;
}
