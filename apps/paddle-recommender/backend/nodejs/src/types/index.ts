// Core paddle recommendation types

export interface UserProfile {
  experience: 'beginner' | 'intermediate' | 'advanced';
  playStyle: 'power' | 'control' | 'balanced';
  budget: {
    min: number;
    max: number;
  };
  preferences?: {
    weight?: 'light' | 'medium' | 'heavy';
    grip?: 'small' | 'medium' | 'large';
    surface?: 'textured' | 'smooth';
  };
}

export interface PaddleSpecifications {
  shape: string;
  surface: string;
  average_weight: number;
  core: number;
  paddle_length: number;
  paddle_width: number;
  grip_length: number;
  grip_type: string;
  grip_circumference: number;
}

export interface PaddlePerformance {
  power: number;
  pop: number;
  spin: number;
  twist_weight: number;
  swing_weight: number;
  balance_point: number;
}

export interface Paddle {
  id: string;
  name: string;
  brand: string;
  price: string;
  weight: string;
  grip: 'small' | 'medium' | 'large';
  surface: 'textured' | 'smooth';
  core: string;
  playStyle: 'power' | 'control' | 'balanced';
  recommendedFor: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  image: string;
  specifications: PaddleSpecifications;
  performance: PaddlePerformance;
}

export interface PaddleRecommendation extends Paddle {
  score: number;
  matchReasons: string[];
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: PaddleRecommendation[];
    profile: UserProfile;
    timestamp: string;
    algorithm: string;
  };
}

export interface PaddleResponse {
  success: boolean;
  data: Paddle;
}

export interface PaddlesResponse {
  success: boolean;
  data: {
    paddles: Paddle[];
    count: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not-ready';
  checks: {
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
}

export * from './paddles';
