import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inventory_ai?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    // Pass the adapter to the PrismaClient constructor
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      // Execute a quick test query to ensure connection is live and usable
      await this.$queryRaw`SELECT 1`;
    } catch (error: any) {
      const logger = new Logger('PrismaService');
      logger.error('Failed to connect to the database. Please ensure your PostgreSQL container is running and configuration is correct.');
      logger.error(error.message || error);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}