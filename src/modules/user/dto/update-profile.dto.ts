import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'phone must be a valid international phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatar_url?: string;
}

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  @MinLength(8)
  new_password: string;
}
