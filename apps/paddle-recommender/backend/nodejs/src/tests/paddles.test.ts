import Fastify, { FastifyInstance } from 'fastify';
import { paddleRoutes } from '../routes/paddles';

describe('Paddles API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(paddleRoutes, { prefix: '/api/paddles' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/paddles/combined pagination', () => {
    it('returns first page with a next cursor when available', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/paddles/combined'
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.count).toBe(body.data.length);
      expect(body.totalCount).toBeGreaterThanOrEqual(body.count);

      if (body.totalCount > body.count) {
        expect(typeof body.nextCursor).toBe('string');
        expect(body.nextCursor.length).toBeGreaterThan(0);
      } else {
        expect(body.nextCursor).toBeUndefined();
      }
    });

    it('returns the next page when a cursor is provided', async () => {
      const firstResponse = await app.inject({
        method: 'GET',
        url: '/api/paddles/combined'
      });

      expect(firstResponse.statusCode).toBe(200);
      const firstBody = JSON.parse(firstResponse.body);

      if (!firstBody.nextCursor) {
        expect(firstBody.totalCount).toBeLessThanOrEqual(firstBody.count);
        return;
      }

      const secondResponse = await app.inject({
        method: 'GET',
        url: `/api/paddles/combined?cursor=${encodeURIComponent(firstBody.nextCursor)}`
      });

      expect(secondResponse.statusCode).toBe(200);
      const secondBody = JSON.parse(secondResponse.body);

      const firstKeys = new Set(
        firstBody.data.map((paddle: { company: string; paddleName: string }) =>
          `${paddle.company}::${paddle.paddleName}`
        )
      );
      const overlap = secondBody.data.some(
        (paddle: { company: string; paddleName: string }) =>
          firstKeys.has(`${paddle.company}::${paddle.paddleName}`)
      );

      expect(overlap).toBe(false);
    });

    it('caps limit at 100', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/paddles/combined?limit=1000'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.count).toBeLessThanOrEqual(100);
    });
  });
});
