import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import {
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.support.create(userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser('sub') userId: string) {
    return this.support.listMine(userId);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  all() {
    return this.support.listAll();
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.support.update(id, dto);
  }
}
