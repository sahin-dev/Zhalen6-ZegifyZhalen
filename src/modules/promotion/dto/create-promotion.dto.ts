import { ArrayUnique, IsArray, IsIn, IsUUID } from 'class-validator';

export class CreatePromotionDto {
  @IsIn(['STARTER', 'PREMIUM', 'PRO'])
  plan: 'STARTER' | 'PREMIUM' | 'PRO';

  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  product_ids: string[];
}
