import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigService as NestConfigService } from '@nestjs/config';

describe('ConfigService', () => {
  let service: ConfigService;
  let mockNestConfigService: Partial<NestConfigService>;

  beforeEach(async () => {
    mockNestConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'PORT') return 3001;
        if (key === 'NODE_ENV') return 'test';
        if (key === 'DATABASE_URL') return 'postgresql://localhost:5432';
        return undefined;
      }) as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return defined port', () => {
    expect(service.port).toBe(3001);
  });

  it('should return nodeEnv', () => {
    expect(service.nodeEnv).toBe('test');
  });

  it('should return databaseUrl', () => {
    expect(service.databaseUrl).toBe('postgresql://localhost:5432');
  });
});
