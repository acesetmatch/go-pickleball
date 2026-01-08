import { FastifyPluginAsync } from 'fastify';
import { HealthResponse, ReadinessResponse } from '../types';
import { PrismaService } from '../services/prismaService';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check endpoint
  fastify.get<{ Reply: HealthResponse }>('/', async (request, reply) => {
    const response: HealthResponse = {
      status: 'healthy',
      service: 'paddle-recommender-typescript',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    reply.send(response);
  });

  // Readiness check endpoint
  fastify.get<{ Reply: ReadinessResponse }>('/ready', async (request, reply) => {
    const prismaService = new PrismaService();
    
    try {
      // Test database connection
      const dbHealthy = await prismaService.testConnection();
      
      const response: ReadinessResponse = {
        status: dbHealthy ? 'ready' : 'not-ready',
        checks: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      const statusCode = dbHealthy ? 200 : 503;
      reply.status(statusCode).send(response);
    } catch (error) {
      const response: ReadinessResponse = {
        status: 'not-ready',
        checks: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };
      
      reply.status(503).send(response);
    }
  });
};

export { healthRoutes };
