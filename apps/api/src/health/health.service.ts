import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<boolean> {
    try {
      // Execute a basic query to check connection health
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      this.logger.error('Database health check failed:', error.message || error);
      return false;
    }
  }
}