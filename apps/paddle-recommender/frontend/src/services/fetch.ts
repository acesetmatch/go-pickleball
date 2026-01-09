// src/lib/fetch.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost';

// Define error interface
export interface ApiError {
  message: string;
  status?: number;
}

// Define paddle creation data interface
export interface CreatePaddleData {
  metadata: {
    brand: string;
    model: string;
    serial_code?: string;
  };
  specs: {
    shape: string;
    surface: string;
    average_weight: number;
    core: number;
    paddle_length: number;
    paddle_width: number;
    grip_length: number;
    grip_type: string;
    grip_circumference: number;
  };
  performance: {
    power: number;
    pop: number;
    spin: number;
    twist_weight: number;
    swing_weight: number;
    balance_point: number;
  };
}

// First, let's define the Paddle interface in fetch.ts so it can be exported and reused
export interface Paddle {
  id: string;
  metadata: {
    brand: string;
    model: string;
    serial_code?: string;
  };
  specs: {
    shape: string;
    surface: string;
    average_weight: number;
    core: number;
    paddle_length: number;
    paddle_width: number;
    grip_length: number;
    grip_type: string;
    grip_circumference: number;
  };
  performance: {
    power: number;
    pop: number;
    spin: number;
    twist_weight: number;
    swing_weight: number;
    balance_point: number;
  };
  image_url?: string;
  buy_url?: string;
  price?: number;
}

// Generic fetch function for GET requests
export async function fetchData<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axios.get<T>(
      `${API_BASE_URL}${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers,
        },
        timeout: 10000, // 10 second timeout
        ...config,
      }
    );
    return response.data;
  } catch (error: unknown) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    
    // Network error check (no response from server)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
      const apiError: ApiError = {
        message: 'Network error. Please check if the server is running.',
        status: 0
      };
      throw apiError;
    }
    
    const apiError: ApiError = {
      message: 'Failed to fetch data. Please try again later.',
      status: undefined
    };
    
    throw apiError;
  }
}

// Generic fetch function for POST requests
export async function postData<T, D = Record<string, unknown>>(
  endpoint: string,
  data: D,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axios.post<T>(
      `${API_BASE_URL}${endpoint}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers,
        },
        timeout: 10000, // 10 second timeout
        ...config,
      }
    );
    return response.data;
  } catch (error: unknown) {
    console.error(`Error posting data to ${endpoint}:`, error);
    
    // Network error check
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
      const apiError: ApiError = {
        message: 'Network error. Please check if the server is running.',
        status: 0
      };
      throw apiError;
    }
    
    const apiError: ApiError = {
      message: 'Failed to submit data. Please try again later.',
      status: undefined
    };
    
    throw apiError;
  }
}

// Update the getAllPaddles function with proper typing
export async function getAllPaddles(): Promise<Paddle[]> {
  return fetchData<Paddle[]>('/api/paddles');
}

// Update the getPaddleById function with proper typing
export async function getPaddleById(id: string): Promise<Paddle> {
  return fetchData<Paddle>(`/api/paddles/${id}`);
}

export async function createPaddle(paddleData: CreatePaddleData): Promise<Paddle> {
  return postData<Paddle, CreatePaddleData>('/api/paddles', paddleData);
}

// Paddle data from external sources interface
export interface SourcePaddle {
  source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';
  company: string;
  paddleName: string;
  price?: string;
  discountCode?: string;
  purchaseLink?: string;
  swingWeight?: number;
  twistWeight?: number;
  weight?: number;
  weightGrams?: number;
  spinRPM?: number;
  serveSpeed?: number;
  punchVolleySpeed?: number;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;
  spinPercentile?: string;
  coreThickness?: number;
  shape?: string;
  length?: number;
  width?: number;
  gripLength?: number;
  gripCircumference?: number;
  gripSize?: number;
  balancePoint?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;
  paddleType?: string;
  manufacturingProcess?: string;
  buildType?: string;
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  powerRating?: number | string;
  spinRating?: string;
  touchShotsRating?: number;
  paddleRating?: string;
  releaseYear?: string;
  approvalBody?: string;
  paddleImage?: string;
  youtubeReview?: string;
  [key: string]: any;
}

export interface AllSourcesResponse {
  success: boolean;
  data: {
    mattspickleball: SourcePaddle[];
    pickleballeffect: SourcePaddle[];
    pickleballstudio: SourcePaddle[];
  };
  counts: {
    mattspickleball: number;
    pickleballeffect: number;
    pickleballstudio: number;
    total: number;
  };
}

export interface SingleSourceResponse {
  success: boolean;
  source: string;
  data: SourcePaddle[];
  count: number;
}

// Get paddle data from all external sources
export async function getAllSources(): Promise<AllSourcesResponse> {
  return fetchData<AllSourcesResponse>('/api/paddles/sources/all');
}

// Get paddle data from a specific source
export async function getSourcePaddles(source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio'): Promise<SingleSourceResponse> {
  return fetchData<SingleSourceResponse>(`/api/paddles/sources/${source}`);
}

// Combined paddle data interface
export interface CombinedPaddle {
  company: string;
  paddleName: string;
  sources: string[];
  sourceCount: number;
  averageRating?: number | null;
  price?: number | string | null;
  swingWeight?: number;
  twistWeight?: number;
  weight?: number;
  weightGrams?: number;
  spinRPM?: number;
  serveSpeed?: number;
  punchVolleySpeed?: number;
  coreThickness?: number;
  length?: number;
  width?: number;
  gripLength?: number;
  gripCircumference?: number;
  gripSize?: number;
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  touchShotsRating?: number;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;
  spinPercentile?: string;
  balancePoint?: string;
  shape?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;
  paddleType?: string;
  manufacturingProcess?: string;
  buildType?: string;
  powerRating?: string;
  spinRating?: string;
  paddleRating?: string;
  releaseYear?: string;
  approvalBody?: string;
  paddleImage?: string;
  youtubeReview?: string;
  bestOffer?: {
    price: string;
    discountCode?: string;
    purchaseLink?: string;
    source: string;
  };
  allSourceData: Array<{
    source: string;
    price?: string;
    discountCode?: string;
    purchaseLink?: string;
    paddleImage?: string;
  }>;
}

export interface CombinedPaddlesResponse {
  success: boolean;
  count: number;
  data: CombinedPaddle[];
}

// Get combined median paddle data
export async function getCombinedPaddles(): Promise<CombinedPaddlesResponse> {
  return fetchData<CombinedPaddlesResponse>('/api/paddles/combined');
}

// Python RAG Recommendation API types
export interface UserPreferences {
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert_pro';
  game_format: 'singles' | 'doubles' | 'both';
  competitive_level: 'recreational' | 'league' | 'tournament';
  playing_styles: Array<
    'aggressive_finishing' | 'all_court' | 'reset_first' | 'hand_speed' |
    'singles_specialist' | 'driving_banger' | 'soft_game' | 'flicks_speed_ups'
  >;
  game_focus: 'power' | 'control' | 'spin' | 'balanced';
  arm_sensitivity: boolean;
  grip_size?: string;
  handle_length?: string;
  weight_tolerance: 'light' | 'medium' | 'heavy';
  paddle_feel: 'more_power' | 'more_control' | 'balanced';
  customization_preference: boolean;
  current_paddle?: string;
  pain_points: Array<
    'resets_fall_short' | 'pop_ups' | 'blocks_too_shallow' |
    'not_enough_spin' | 'wrist_hand_speed' | 'vibration_comfort'
  >;
  additional_notes?: string;
  playing_environment: number; // 0-100, 0=outdoor, 100=indoor
  common_opponents: Array<'bangers' | 'dinkers' | 'mixed'>;
  budget_min: number;
  budget_max: number;
  preferred_brands?: string[];
  brands_to_avoid?: string[];
  primary_goal: 'consistency' | 'power' | 'spin' | 'control';
  target_rating?: number;
}

export interface PaddleRecommendation {
  id: number;
  company: string;
  paddle_name: string;
  price?: number;
  match_score: number;
  match_reasons: string[];
  specs: {
    weight?: number;
    swing_weight?: number;
    twist_weight?: number;
    core_thickness?: number;
    spin_rpm?: number;
    control_rating?: number;
    power_rating?: string;
    spin_rating?: string;
    feel_rating?: number;
    forgiveness_rating?: number;
    touch_shots_rating?: number;
  };
  purchase_link?: string;
  paddle_image?: string;
  source: string;
}

// Get paddle recommendations from Python RAG engine
const PYTHON_API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_BASE_URL || 'http://localhost:8000';

export async function getPaddleRecommendations(
  preferences: UserPreferences
): Promise<PaddleRecommendation[]> {
  try {
    const response = await axios.post<PaddleRecommendation[]>(
      `${PYTHON_API_BASE_URL}/api/recommendations`,
      preferences,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for RAG processing
      }
    );
    return response.data;
  } catch (error: unknown) {
    console.error('Error getting paddle recommendations:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
      const apiError: ApiError = {
        message: 'Network error. Please check if the Python recommendation server is running.',
        status: 0
      };
      throw apiError;
    }

    const apiError: ApiError = {
      message: 'Failed to get paddle recommendations. Please try again later.',
      status: undefined
    };
    throw apiError;
  }
}
