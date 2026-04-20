import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { type ConfigType } from '@nestjs/config';
import dbConfiguration, {dbConfig} from 'src/config/db.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name)

  constructor(@Inject(dbConfiguration.KEY) private readonly dbProperty:ConfigType<typeof dbConfig>) {
    
    const prisma_adapter = new PrismaPg({connectionString:dbProperty.connection_string})
    super({adapter:prisma_adapter})
  }

  onModuleInit() {
        this.$connect()
        .then(() => {
            this.logger.log("Database connected successfully")
        })
        .catch((err)=> {
            this.logger.error(err)
        })
  }

  onModuleDestroy() {
      this.$disconnect()
  }

}
