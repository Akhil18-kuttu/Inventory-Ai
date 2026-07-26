import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './config.interface';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfigService: NestConfigService<EnvironmentVariables, true>) {}

  get nodeEnv(): string {
    return this.nestConfigService.get<string>('NODE_ENV');
  }

  get port(): number {
    return this.nestConfigService.get<number>('PORT');
  }

  get databaseUrl(): string {
    return this.nestConfigService.get<string>('DATABASE_URL');
  }

  get jwtSecret(): string {
    return this.nestConfigService.get<string>('JWT_SECRET');
  }

  get jwtExpires(): string {
    return this.nestConfigService.get<string>('JWT_EXPIRES');
  }

  get jwtRefreshSecret(): string {
    return this.nestConfigService.get<string>('JWT_REFRESH_SECRET');
  }

  get jwtRefreshExpires(): string {
    return this.nestConfigService.get<string>('JWT_REFRESH_EXPIRES');
  }
}
