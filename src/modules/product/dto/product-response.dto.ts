export class ProductResponseDto {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  price: number;
  sizes: string;
  verified: boolean;
  verification_document_url?: string | null;
  stock: number;
  brand_id: string;
  category_id: string;
  seller_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductCategoryDto {
  id: string;
  title: string;
  icon?: string;
}

export class BrandDto {
  id: string;
  title: string;
  image_url?: string;
}
