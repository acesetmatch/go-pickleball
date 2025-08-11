// src/lib/fetch.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost';

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