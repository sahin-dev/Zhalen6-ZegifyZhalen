import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;
}

export class UpdateSupportTicketDto {
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  admin_response?: string;
}
