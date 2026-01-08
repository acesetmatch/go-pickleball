# Paddle Recommender - TypeScript + Fastify Service

A TypeScript + Fastify API service for paddle recommendations, built alongside the existing Go implementation to demonstrate modern full-stack JavaScript/TypeScript capabilities.

## Features

- **RESTful API** - Clean, well-documented endpoints
- **Smart Recommendations** - Algorithm considering experience, play style, and preferences
- **Input Validation** - Joi schema validation for all requests
- **Error Handling** - Comprehensive error handling and logging
- **Health Checks** - Built-in health and readiness endpoints
- **Docker Ready** - Containerized for easy deployment

## API Endpoints

### Health Check
```
GET /api/v1/health
GET /api/v1/health/ready
```

### Recommendations
```
POST /api/v1/recommendations
GET /api/v1/recommendations/paddle/:id
GET /api/v1/recommendations/paddles
```

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Production
```bash
# Build and run with Docker
docker build -t paddle-recommender-nodejs .
docker run -p 3001:3001 paddle-recommender-nodejs
```

## Example Request

```bash
curl -X POST http://localhost:3001/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "experience": "intermediate",
    "playStyle": "balanced",
    "budget": {
      "min": 150,
      "max": 250
    },
    "preferences": {
      "weight": "medium",
      "grip": "medium",
      "surface": "textured"
    }
  }'
```

## Example Response

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "engage-pursuit-mx-6.0",
        "name": "Pursuit MX 6.0",
        "brand": "Engage",
        "price": "$199.99",
        "score": 0.92,
        "matchReasons": [
          "Perfect for intermediate players",
          "Matches your balanced play style",
          "Medium weight as preferred"
        ],
        "specifications": {
          "weight": "7.8 oz",
          "grip": "medium",
          "surface": "textured",
          "core": "Polymer"
        }
      }
    ],
    "algorithm": "nodejs-v1",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Architecture

```
src/
├── routes/          # API route handlers
├── services/        # Business logic
├── middleware/      # Express middleware
├── utils/          # Utilities (logging, etc.)
└── data/           # Static data files
```

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Joi** - Input validation
- **Winston** - Logging
- **Helmet** - Security headers
- **Docker** - Containerization

## Environment Variables

```bash
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

The service is containerized and can be deployed to any Docker-compatible platform:

- **Local Docker**
- **Docker Compose**
- **Kubernetes**
- **Cloud platforms** (AWS ECS, Google Cloud Run, etc.)

## Comparison with Go Service

This Node.js implementation provides the same functionality as the Go service but with:

- **JavaScript ecosystem** - Easier integration with React frontend
- **Rapid development** - Faster iteration for new features
- **JSON-first** - Native JSON handling
- **NPM packages** - Rich ecosystem of libraries

Both services can run simultaneously, allowing for A/B testing and gradual migration strategies.
