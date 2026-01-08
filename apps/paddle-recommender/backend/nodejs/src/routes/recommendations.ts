import { FastifyPluginAsync } from 'fastify';
import { UserProfile, RecommendationResponse, PaddleResponse, PaddlesResponse, ErrorResponse } from '../types';
import { recommendationService } from '../services/recommendationService';

// JSON Schema for request validation
const profileSchema = {
  type: 'object',
  required: ['experience', 'playStyle', 'budget'],
  properties: {
    experience: {
      type: 'string',
      enum: ['beginner', 'intermediate', 'advanced']
    },
    playStyle: {
      type: 'string',
      enum: ['power', 'control', 'balanced']
    },
    budget: {
      type: 'object',
      required: ['min', 'max'],
      properties: {
        min: { type: 'number', minimum: 0 },
        max: { type: 'number', minimum: 0 }
      }
    },
    preferences: {
      type: 'object',
      properties: {
        weight: {
          type: 'string',
          enum: ['light', 'medium', 'heavy']
        },
        grip: {
          type: 'string',
          enum: ['small', 'medium', 'large']
        },
        surface: {
          type: 'string',
          enum: ['textured', 'smooth']
        }
      }
    }
  }
};

const recommendationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get paddle recommendations
  fastify.post<{
    Body: UserProfile;
    Reply: RecommendationResponse | ErrorResponse;
  }>('/', {
    schema: {
      body: profileSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      brand: { type: 'string' },
                      price: { type: 'string' },
                      score: { type: 'number' },
                      matchReasons: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                },
                profile: { type: 'object' },
                timestamp: { type: 'string' },
                algorithm: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const profile = request.body;
      
      request.log.info('Processing recommendation request');

      const recommendations = await recommendationService.getRecommendations(profile);
      
      const response: RecommendationResponse = {
        success: true,
        data: {
          recommendations,
          profile: profile,
          timestamp: new Date().toISOString(),
          algorithm: 'typescript-fastify-v1'
        }
      };

      reply.send(response);
    } catch (error) {
      request.log.error(error, 'Error processing recommendation request');
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Failed to process recommendation request'
      };

      reply.status(500).send(errorResponse);
    }
  });

  // Get paddle details by ID
  fastify.get<{
    Params: { id: string };
    Reply: PaddleResponse | ErrorResponse;
  }>('/paddle/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const paddle = await recommendationService.getPaddleById(id);
      
      if (!paddle) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: 'Paddle not found'
        };
        return reply.status(404).send(errorResponse);
      }
      
      const response: PaddleResponse = {
        success: true,
        data: paddle
      };

      reply.send(response);
    } catch (error) {
      request.log.error(error, 'Error fetching paddle details');
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Failed to fetch paddle details'
      };

      reply.status(500).send(errorResponse);
    }
  });

  // Get all available paddles (for debugging/admin)
  fastify.get<{
    Reply: PaddlesResponse | ErrorResponse;
  }>('/paddles', async (request, reply) => {
    try {
      const paddles = await recommendationService.getAllPaddles();
      
      const response: PaddlesResponse = {
        success: true,
        data: {
          paddles,
          count: paddles.length
        }
      };

      reply.send(response);
    } catch (error) {
      request.log.error(error, 'Error fetching all paddles');
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Failed to fetch paddles'
      };

      reply.status(500).send(errorResponse);
    }
  });
};

export { recommendationRoutes };
