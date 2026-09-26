import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({ require_protocol: true }, { each: true })
  image_urls?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  price?: number;

  @IsOptional()
  @IsString()
  sizes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  verification_document_url?: string;

  @IsOptional()
  @IsUUID()
  brand_id?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
