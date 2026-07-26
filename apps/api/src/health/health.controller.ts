import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { ApiResponse as ApiResponseType } from '../common/types/api-response.type';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and database health' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async checkHealth(): Promise<ApiResponseType> {
    const dbOk = await this.healthService.checkDatabase();
    
    if (!dbOk) {
      throw new ServiceUnavailableException('Database connection failed');
    }

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    } as any;
  }
}