import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup the test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await app.close();
  });

  it('/auth/register (POST) - should register a new user successfully', () => {
    return supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.email).toBe(testEmail);
        expect(res.body.data).not.toHaveProperty('passwordHash');
      });
  });

  it('/auth/register (POST) - should reject duplicate email registration', () => {
    return supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(HttpStatus.CONFLICT)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('CONFLICT');
        expect(res.body.error.message).toContain('already registered');
      });
  });

  it('/auth/login (POST) - should authenticate user and issue tokens', () => {
    return supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
      });
  });

  it('/auth/login (POST) - should reject incorrect password login', () => {
    return supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'wrongPassword',
      })
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
  });

  it('/auth/me (GET) - should return user profile with valid access token', () => {
    return supertest(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(testEmail);
      });
  });

  it('/auth/me (GET) - should return 401 Unauthorized without token', () => {
    return supertest(app.getHttpServer())
      .get('/auth/me')
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
  });

  it('/auth/refresh (POST) - should issue new tokens given valid refresh token', () => {
    return supertest(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
      });
  });

  it('/auth/logout (POST) - should log out user successfully', () => {
    return supertest(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });

  it('/auth/refresh (POST) - should reject refresh token after logout invalidation', () => {
    return supertest(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
  });
});
