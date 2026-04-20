import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class SignUpDto {
    
  @IsString()
  @MinLength(2)
  full_name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('US')
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
