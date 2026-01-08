import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import env from '@fastify/env';
import { recommendationRoutes } from './routes/recommendations';
import { healthRoutes } from './routes/health';
import { paddleRoutes } from './routes/paddles';

const envSchema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: {
      type: 'string',
      default: '3001'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    LOG_LEVEL: {
      type: 'string',
      default: 'info'
    },
    CORS_ORIGIN: {
      type: 'string',
      default: 'http://localhost:3000'
    }
  }
};

const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  } : {
    level: process.env.LOG_LEVEL || 'info'
  }
});

const start = async (): Promise<void> => {
  try {
    // Register environment validation
    await fastify.register(env, {
      schema: envSchema,
      dotenv: true
    });

    // Register security plugins
    await fastify.register(helmet, {
      contentSecurityPolicy: false
    });

    await fastify.register(cors, {
      origin: fastify.config.CORS_ORIGIN
    });

    // Register routes
    await fastify.register(healthRoutes, { prefix: '/api/v1/health' });
    await fastify.register(recommendationRoutes, { prefix: '/api/v1/recommendations' });
    await fastify.register(paddleRoutes, { prefix: '/api/paddles' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error, 'Unhandled error');
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';
      
      const response = {
        success: false,
        error: message
      };
      
      if (fastify.config.NODE_ENV === 'development') {
        (response as any).details = {
          message: error.message,
          stack: error.stack
        };
      }
      
      reply.status(statusCode).send(response);
    });

    // 404 handler
    fastify.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        success: false,
        error: 'Route not found',
        path: request.url
      });
    });

    // Start server
    const port = parseInt(fastify.config.PORT, 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    
    fastify.log.info(`🚀 TypeScript + Fastify Paddle Recommendation Service running on port ${port}`);
    fastify.log.info(`Environment: ${fastify.config.NODE_ENV}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

start();

// Extend Fastify config type
declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: string;
      NODE_ENV: string;
      LOG_LEVEL: string;
      CORS_ORIGIN: string;
    };
  }
}
