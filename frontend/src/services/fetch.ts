// src/lib/fetch.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Define error interface
export interface ApiError {
  message: string;
  status?: number;
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
        ...config,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    
    const apiError: ApiError = {
      message: error.response?.data?.message || 'Failed to fetch data. Please try again later.',
      status: error.response?.status
    };
    
    throw apiError;
  }
}

// Generic fetch function for POST requests
export async function postData<T, D = any>(
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
        ...config,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error posting data to ${endpoint}:`, error);
    
    const apiError: ApiError = {
      message: error.response?.data?.message || 'Failed to submit data. Please try again later.',
      status: error.response?.status
    };
    
    throw apiError;
  }
}

// Paddle-specific API functions
export async function getPaddleById(id: string): Promise<any> {
  return fetchData<any>(`/paddle/${id}`);
}

export async function getAllPaddles(): Promise<any[]> {
  return fetchData<any[]>(`/paddles`);
}

export async function createPaddle(paddleData: any): Promise<any> {
  return postData<any, any>(`/paddle`, paddleData);
}