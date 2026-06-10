import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLoadPaddleData } from '../useLoadPaddleData';

const mockGetCombinedPaddles = vi.fn();

vi.mock('@/services/fetch', () => ({
  getCombinedPaddles: (...args: any[]) => mockGetCombinedPaddles(...args),
}));

const mockPaddle = { company: 'Selkirk', paddleName: 'AMPED-Epic', sources: [] };

describe('useLoadPaddleData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading as true initially', () => {
    mockGetCombinedPaddles.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useLoadPaddleData('Selkirk-AMPED-Epic'));
    expect(result.current.loading).toBe(true);
    expect(result.current.paddle).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('finds paddle by company-paddleName in returned data', async () => {
    mockGetCombinedPaddles.mockResolvedValue({ data: [mockPaddle] });
    const { result } = renderHook(() => useLoadPaddleData('Selkirk-AMPED-Epic'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.paddle).toEqual(mockPaddle);
    expect(result.current.error).toBeNull();
  });

  it('returns error when paddle not found', async () => {
    mockGetCombinedPaddles.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useLoadPaddleData('Nonexistent-Paddle'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.paddle).toBeNull();
    expect(result.current.error).toBe('Paddle not found');
  });

  it('returns error on fetch failure', async () => {
    mockGetCombinedPaddles.mockRejectedValue(new Error('API Error'));
    const { result } = renderHook(() => useLoadPaddleData('Selkirk-AMPED-Epic'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.paddle).toBeNull();
    expect(result.current.error).toBe('API Error');
  });
});
