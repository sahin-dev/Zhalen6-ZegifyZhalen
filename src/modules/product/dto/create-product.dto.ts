import { IsNumber, IsString, IsUUID, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  title: string;
  @IsString()
  description: string;
  @IsString({each:true})
  image_urls: string[];
  @IsNumber()
  @Min(1)
  price: number;
  @IsString()
  sizes: string;
  @IsUUID()
  brand_id: string;
  @IsUUID()
  category_id: string;
  @IsUUID()
  seller_id: string;
}
