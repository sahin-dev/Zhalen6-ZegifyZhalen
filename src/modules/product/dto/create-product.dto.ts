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

export class CreateProductDto {
  @IsString()
  title: string;
  @IsString()
  description: string;
  @IsArray()
  @IsUrl({ require_protocol: true }, { each: true })
  image_urls: string[];
  @IsNumber()
  @Min(1)
  price: number;
  @IsString()
  sizes: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  verification_document_url?: string;
  @IsUUID()
  brand_id: string;
  @IsUUID()
  category_id: string;
}
