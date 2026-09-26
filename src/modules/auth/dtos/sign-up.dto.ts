import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsIn,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(2)
  full_name: string;

  @IsEmail()
  email: string;

  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'phone must be a valid international phone number',
  })
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  confirm_password?: string;

  @IsOptional()
  @IsIn(['BUYER', 'SELLER'])
  role?: 'BUYER' | 'SELLER';

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
