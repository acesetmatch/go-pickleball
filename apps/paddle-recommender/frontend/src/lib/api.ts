import { z } from 'zod';
import { Profile, VideoMeta } from '@/schemas/profile';

// Environment variable for recommender service URL
const RECOMMENDER_URL = process.env.NEXT_PUBLIC_RECOMMENDER_URL || 'http://localhost:8000';

// API Response schemas
const RecommendationResponseSchema = z.object({
  recommendation_id: z.string(),
  recommendations: z.array(z.object({
    paddle_id: z.string(),
    name: z.string(),
    brand: z.string(),
    price: z.number(),
    match_score: z.number().min(0).max(100),
    reasons: z.array(z.string()),
    image_url: z.string().optional(),
    specs: z.object({
      weight: z.number().optional(),
      thickness: z.number().optional(),
      surface: z.string().optional(),
      core: z.string().optional(),
    }).optional(),
  })),
  confidence: z.enum(['high', 'medium', 'low']),
  processing_time_ms: z.number(),
});

const FeedbackResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  feedback_id: z.string().optional(),
});

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public issues?: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Types
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;

export interface RecommendRequest {
  profile: Profile;
  video?: VideoMeta | null;
  timestamp: string;
  confidence: string;
}

export interface FeedbackRequest {
  recommendation_id: string;
  paddle_id: string;
  rating: number; // 1-5 stars
  feedback_type: 'like' | 'dislike' | 'purchase' | 'not_interested';
  comments?: string;
  user_id?: string;
}

// Utility function to create fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  }
};

// API Functions
export async function postRecommend(request: RecommendRequest): Promise<RecommendationResponse> {
  try {
    const response = await fetchWithTimeout(
      `${RECOMMENDER_URL}/recommend`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `Recommendation request failed: ${errorText}`,
        response.status,
        'RECOMMEND_FAILED'
      );
    }

    const data = await response.json();
    
    // Parse and validate response with Zod
    const result = RecommendationResponseSchema.safeParse(data);
    if (!result.success) {
      throw new ValidationError(
        'Invalid recommendation response format',
        result.error.issues
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiError || error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    }
    
    // Handle network errors
    throw new ApiError(
      `Network error during recommendation request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      'NETWORK_ERROR'
    );
  }
}

export async function postFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  try {
    const response = await fetchWithTimeout(
      `${RECOMMENDER_URL}/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `Feedback submission failed: ${errorText}`,
        response.status,
        'FEEDBACK_FAILED'
      );
    }

    const data = await response.json();
    
    // Parse and validate response with Zod
    const result = FeedbackResponseSchema.safeParse(data);
    if (!result.success) {
      throw new ValidationError(
        'Invalid feedback response format',
        result.error.issues
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiError || error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    }
    
    // Handle network errors
    throw new ApiError(
      `Network error during feedback submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      'NETWORK_ERROR'
    );
  }
}

// Utility function to check if recommender service is available
export async function checkRecommenderHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${RECOMMENDER_URL}/health`,
      { method: 'GET' },
      5000 // 5 second timeout for health check
    );
    return response.ok;
  } catch {
    return false;
  }
}
