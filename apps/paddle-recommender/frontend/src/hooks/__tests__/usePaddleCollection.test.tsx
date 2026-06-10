import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaddleCollection } from '../usePaddleCollection';

vi.mock('@/hooks/useLoadCombinedPaddles', () => ({
  useLoadCombinedPaddles: vi.fn(),
}));

vi.mock('@/lib/normalizeCompanyName', () => ({
  normalizeCompanyName: (name: string) => name,
}));

import { useLoadCombinedPaddles } from '@/hooks/useLoadCombinedPaddles';
const mockUseLoadCombinedPaddles = useLoadCombinedPaddles as any;

function createWrapper() {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePaddleCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading as true initially', () => {
    mockUseLoadCombinedPaddles.mockReturnValue({
      paddles: [],
      loading: true,
      error: null,
    });
    const { result } = renderHook(() => usePaddleCollection(), { wrapper: createWrapper() });
    expect(result.current.loading).toBe(true);
    expect(result.current.paddles).toEqual([]);
  });

  it('returns paddles and computed data on success', () => {
    const mockPaddles = [
      { company: 'Selkirk', paddleName: 'Epic', sources: ['mattspickleball'], sourceCount: 1 },
      { company: 'JOOLA', paddleName: 'Hyperion', sources: ['mattspickleball'], sourceCount: 1 },
      { company: 'Selkirk', paddleName: 'Vanguard', sources: ['mattspickleball'], sourceCount: 1 },
    ];
    mockUseLoadCombinedPaddles.mockReturnValue({
      paddles: mockPaddles,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => usePaddleCollection(), { wrapper: createWrapper() });
    expect(result.current.loading).toBe(false);
    expect(result.current.paddles).toEqual(mockPaddles);
    expect(result.current.brands).toEqual(['JOOLA', 'Selkirk']);
  });

  it('returns error on failure', () => {
    mockUseLoadCombinedPaddles.mockReturnValue({
      paddles: [],
      loading: false,
      error: 'API Error',
    });
    const { result } = renderHook(() => usePaddleCollection(), { wrapper: createWrapper() });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });
});
