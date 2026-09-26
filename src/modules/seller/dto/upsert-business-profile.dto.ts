import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class SellerDocumentDto {
  @IsIn(['BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'OWNER_ID'])
  type: 'BUSINESS_LICENSE' | 'TAX_CERTIFICATE' | 'OWNER_ID';

  @IsUrl({ require_protocol: true })
  file_url: string;
}

export class UpsertBusinessProfileDto {
  @IsString()
  @MinLength(2)
  business_name: string;

  @IsString()
  category: string;

  @IsString()
  registration_number: string;

  @IsOptional()
  @IsString()
  tax_number?: string;

  @IsEmail()
  business_email: string;

  @IsString()
  business_phone: string;

  @IsString()
  business_address: string;

  @IsString()
  city: string;

  @IsString()
  zip_code: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  website_url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SellerDocumentDto)
  documents?: SellerDocumentDto[];
}

export class ReviewSellerDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
