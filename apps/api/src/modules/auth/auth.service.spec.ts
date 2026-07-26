import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { HashUtil } from '../../common/utils/hash.util';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    refreshTokenHash: 'hashedRefresh',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const mockConfigService = {
    jwtSecret: 'access-secret',
    jwtExpires: '1d',
    jwtRefreshSecret: 'refresh-secret',
    jwtRefreshExpires: '7d',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      jest.spyOn(HashUtil, 'hashPassword').mockResolvedValue('hashedPassword');

      const dto = { email: 'test@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' };
      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const dto = { email: 'test@example.com', password: 'password123' };
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(HashUtil, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(HashUtil, 'hashPassword').mockResolvedValue('newHashedRefresh');
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(HashUtil, 'comparePassword').mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrongPassword' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear user refresh token hash', async () => {
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, refreshTokenHash: null });

      const result = await service.logout('user-uuid');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { refreshTokenHash: null },
      });
      expect(result.success).toBe(true);
    });
  });
});
