import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PolicyType } from './create-site-policy.dto';

export class UpdateSitePolicyDto {
  @IsEnum(PolicyType, {
    message: 'Type must be either Privacy or Terms',
  })
  @IsOptional()
  type?: PolicyType;

  @IsString({ message: 'Content must be a string' })
  @IsOptional()
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content?: string;
}
