import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { type ConfigType } from '@nestjs/config';
import dbConfiguration, { dbConfig } from '../config/db.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @Inject(dbConfiguration.KEY)
    private readonly dbProperty: ConfigType<typeof dbConfig>,
  ) {
    const prisma_adapter = new PrismaPg({
      connectionString: dbProperty.connection_string,
    });
    super({ adapter: prisma_adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
