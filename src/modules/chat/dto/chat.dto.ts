import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  seller_id: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text: string;
}
