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
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
    return this.notifications.list(userId, query);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(dto);
  }
}
