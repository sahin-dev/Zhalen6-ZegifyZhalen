export class UserResponseDto {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string | null;
  address?: string | null;
  role: string;
  createdAt: Date;
}

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: UserResponseDto;
}
