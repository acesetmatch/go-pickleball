import Fastify, { FastifyInstance } from 'fastify';
import { recommendationRoutes } from '../routes/recommendations';
import { UserProfile } from '../types';

describe('Paddle Recommendations API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(recommendationRoutes, { prefix: '/api/v1/recommendations' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/recommendations', () => {
    it('should return recommendations for valid profile', async () => {
      const profile: UserProfile = {
        experience: 'intermediate',
        playStyle: 'balanced',
        budget: {
          min: 150,
          max: 250
        },
        preferences: {
          weight: 'medium',
          grip: 'medium',
          surface: 'textured'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/recommendations',
        payload: profile
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.recommendations).toBeDefined();
      expect(Array.isArray(body.data.recommendations)).toBe(true);
      expect(body.data.recommendations.length).toBeGreaterThan(0);
      
      // Check recommendation structure
      const recommendation = body.data.recommendations[0];
      expect(recommendation).toHaveProperty('id');
      expect(recommendation).toHaveProperty('name');
      expect(recommendation).toHaveProperty('brand');
      expect(recommendation).toHaveProperty('price');
      expect(recommendation).toHaveProperty('score');
      expect(recommendation).toHaveProperty('matchReasons');
      expect(typeof recommendation.score).toBe('number');
      expect(Array.isArray(recommendation.matchReasons)).toBe(true);
    });

    it('should return 400 for invalid profile', async () => {
      const invalidProfile = {
        experience: 'invalid',
        playStyle: 'balanced'
        // Missing required budget field
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/recommendations',
        payload: invalidProfile
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should filter by budget correctly', async () => {
      const profile: UserProfile = {
        experience: 'beginner',
        playStyle: 'control',
        budget: {
          min: 50,
          max: 100
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/recommendations',
        payload: profile
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      
      // All recommendations should be within budget
      body.data.recommendations.forEach((paddle: any) => {
        const price = parseFloat(paddle.price.replace('$', ''));
        expect(price).toBeGreaterThanOrEqual(profile.budget.min);
        expect(price).toBeLessThanOrEqual(profile.budget.max);
      });
    });

    it('should return algorithm identifier', async () => {
      const profile: UserProfile = {
        experience: 'advanced',
        playStyle: 'power',
        budget: {
          min: 200,
          max: 300
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/recommendations',
        payload: profile
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.data.algorithm).toBe('typescript-fastify-v1');
      expect(body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/recommendations/paddle/:id', () => {
    it('should return paddle details for valid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/recommendations/paddle/engage-pursuit-mx-6.0'
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe('engage-pursuit-mx-6.0');
      expect(body.data.specifications).toBeDefined();
      expect(body.data.performance).toBeDefined();
    });

    it('should return 404 for invalid paddle ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/recommendations/paddle/non-existent-paddle'
      });

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Paddle not found');
    });
  });

  describe('GET /api/v1/recommendations/paddles', () => {
    it('should return all paddles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/recommendations/paddles'
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.paddles).toBeDefined();
      expect(Array.isArray(body.data.paddles)).toBe(true);
      expect(body.data.count).toBeGreaterThan(0);
      expect(body.data.count).toBe(body.data.paddles.length);
    });
  });
});
