import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { EventsModule } from '../src/events/events.module';
import { UsersModule } from '../src/users/users.module';
import { Event } from '../src/events/entities/event.entity';
import { User } from '../src/users/entities/user.entity';

describe('Events (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Event, User],
          synchronize: true,
        }),
        EventsModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // main.ts's ValidationPipe isn't applied automatically in tests —
    // this app instance is built fresh here, bypassing bootstrap() entirely.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper so each test doesn't have to repeat the create-a-user boilerplate.
  async function createUser(name: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ name })
      .expect(201);
    return res.body.id;
  }

  describe('POST /events', () => {
    it('creates an event with invitees', async () => {
      const aliceId = await createUser('Alice');

      const res = await request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Standup',
          startTime: '2026-07-28T14:00:00.000Z',
          endTime: '2026-07-28T15:00:00.000Z',
          inviteeIds: [aliceId],
        })
        .expect(201);

      expect(res.body.title).toBe('Standup');
      expect(res.body.status).toBe('TODO');
      expect(res.body.invitees).toHaveLength(1);
      expect(res.body.invitees[0].id).toBe(aliceId);
    });

    it('rejects an invalid payload with 400', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({ title: '' }) // missing required fields, blank title
        .expect(400);
    });
  });

  describe('GET /events/:id', () => {
    it('returns 404 for an unknown id', () => {
      return request(app.getHttpServer())
        .get('/events/00000000-0000-4000-8000-000000000000')
        .expect(404);
    });
  });

  describe('DELETE /events/:id', () => {
    it('deletes an event and then 404s on re-fetch', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Temp Event',
          startTime: '2026-07-28T10:00:00.000Z',
          endTime: '2026-07-28T11:00:00.000Z',
        })
        .expect(201);

      const id = createRes.body.id;

      await request(app.getHttpServer()).delete(`/events/${id}`).expect(200);
      await request(app.getHttpServer()).get(`/events/${id}`).expect(404);
    });
  });

  describe('POST /events/users/:userId/merge-all', () => {
    it('merges overlapping events and unions invitees, end to end', async () => {
      const aliceId = await createUser('Alice');
      const bobId = await createUser('Bob');

      await request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Hangout 1',
          startTime: '2026-07-28T14:00:00.000Z',
          endTime: '2026-07-28T15:00:00.000Z',
          inviteeIds: [aliceId],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Hangout 2',
          startTime: '2026-07-28T14:45:00.000Z',
          endTime: '2026-07-28T16:00:00.000Z',
          inviteeIds: [aliceId, bobId],
        })
        .expect(201);

      const mergeRes = await request(app.getHttpServer())
        .post(`/events/users/${aliceId}/merge-all`)
        .expect(201);

      expect(mergeRes.body).toHaveLength(1);
      const merged = mergeRes.body[0];
      expect(merged.startTime).toBe('2026-07-28T14:00:00.000Z');
      expect(merged.endTime).toBe('2026-07-28T16:00:00.000Z');
      expect(merged.invitees).toHaveLength(2);

      const inviteeIds = merged.invitees.map((u: any) => u.id).sort();
      expect(inviteeIds).toEqual([aliceId, bobId].sort());
    });
  });
});