import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Register a new user and log in to get JWT
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Test User',
      email: 'test-user@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test-user@example.com', password: 'password123' });

    jwtToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) - should get all users with token', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/users/:id (GET) - should get specific user', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${jwtToken}`);
    const userId = res.body[0].id;

    const res2 = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res2.body.id).toBe(userId);
  });
});
