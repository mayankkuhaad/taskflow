import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Register & Login test user to get JWT token
    const registerPayload = {
      name: 'Test User',
      email: 'taskuser@example.com',
      password: 'strongpassword',
    };

    await request(app.getHttpServer()).post('/auth/register').send(registerPayload);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerPayload.email, password: registerPayload.password });

    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks - should create a task', async () => {
    const dto = {
      title: 'E2E Test Task',
      description: 'This is an end-to-end test task.',
      priority: 'high',
    };

    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(dto);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(dto.title);
  });

  it('GET /tasks - should return tasks for logged-in user', async () => {
    const res = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /tasks/stats - should return stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/tasks/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total');
  });

  it('Unauthorized access should fail', async () => {
    const res = await request(app.getHttpServer()).get('/tasks');
    expect(res.status).toBe(401);
  });
});
