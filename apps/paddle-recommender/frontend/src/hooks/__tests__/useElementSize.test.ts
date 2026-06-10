import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useElementSize } from '../useElementSize';

describe('useElementSize', () => {
  it('returns ref function and initial size of 0', () => {
    const { result } = renderHook(() => useElementSize());
    expect(typeof result.current.ref).toBe('function');
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
  });

  it('is callable with generic type parameter', () => {
    const { result } = renderHook(() => useElementSize<HTMLDivElement>());
    expect(typeof result.current.ref).toBe('function');
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
  });
});
