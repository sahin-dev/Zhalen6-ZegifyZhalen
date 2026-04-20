import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export enum PolicyType {
  Privacy = 'Privacy',
  Terms = 'Terms',
}

export class CreateSitePolicyDto {
  @IsEnum(PolicyType, {
    message: 'Type must be either Privacy or Terms',
  })
  @IsNotEmpty({ message: 'Type is required' })
  type: PolicyType;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content: string;
}
