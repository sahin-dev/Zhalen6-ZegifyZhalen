import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dtos';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';

@Controller('conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @Roles('BUYER')
  create(
    @CurrentUser('sub') buyerId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chat.createConversation(buyerId, dto.seller_id);
  }

  @Get()
  @Roles('BUYER', 'SELLER')
  list(@CurrentUser('sub') userId: string) {
    return this.chat.list(userId);
  }

  @Get(':id/messages')
  @Roles('BUYER', 'SELLER')
  messages(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chat.messages(userId, id, query);
  }

  @Post(':id/messages')
  @Roles('BUYER', 'SELLER')
  send(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.send(userId, id, dto.text);
  }

  @Patch(':id/read')
  @Roles('BUYER', 'SELLER')
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.chat.markRead(userId, id);
  }
}
