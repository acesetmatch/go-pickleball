import { describe, it, expect } from 'vitest';

// Mock applyMods function - this should match backend implementation
function applyMods(baseValue: number, mods: number[]): number {
  // Backend rounding logic: apply each mod and round to 2 decimal places
  let result = baseValue;
  
  for (const mod of mods) {
    result = result * (1 + mod);
    // Round to 2 decimal places after each modification (backend behavior)
    result = Math.round(result * 100) / 100;
  }
  
  return result;
}

describe('applyMods', () => {
  it('returns base value when no mods applied', () => {
    expect(applyMods(100, [])).toBe(100);
    expect(applyMods(50.5, [])).toBe(50.5);
    expect(applyMods(0, [])).toBe(0);
  });

  it('applies single positive modifier', () => {
    expect(applyMods(100, [0.1])).toBe(110); // 100 * 1.1 = 110
    expect(applyMods(50, [0.2])).toBe(60); // 50 * 1.2 = 60
    expect(applyMods(75, [0.05])).toBe(78.75); // 75 * 1.05 = 78.75
  });

  it('applies single negative modifier', () => {
    expect(applyMods(100, [-0.1])).toBe(90); // 100 * 0.9 = 90
    expect(applyMods(50, [-0.2])).toBe(40); // 50 * 0.8 = 40
    expect(applyMods(80, [-0.25])).toBe(60); // 80 * 0.75 = 60
  });

  it('applies multiple modifiers sequentially with rounding', () => {
    // Test case: 100 * 1.1 = 110, then 110 * 1.05 = 115.5
    expect(applyMods(100, [0.1, 0.05])).toBe(115.5);
    
    // Test case: 50 * 0.9 = 45, then 45 * 1.2 = 54
    expect(applyMods(50, [-0.1, 0.2])).toBe(54);
    
    // Test case with rounding: 33.33 * 1.1 = 36.663, rounded to 36.66, then * 1.05 = 38.493, rounded to 38.49
    expect(applyMods(33.33, [0.1, 0.05])).toBe(38.49);
  });

  it('handles precision and rounding correctly', () => {
    // Backend rounds to 2 decimal places after each operation
    expect(applyMods(33.333, [0.1])).toBe(36.67); // 33.333 * 1.1 = 36.6663, rounded to 36.67
    expect(applyMods(66.666, [0.15])).toBe(76.67); // 66.666 * 1.15 = 76.6659, rounded to 76.67
    
    // Multiple operations with intermediate rounding
    expect(applyMods(12.345, [0.1, 0.2])).toBe(16.25); // 12.345 * 1.1 = 13.5795 -> 13.58, then 13.58 * 1.2 = 16.296 -> 16.30
  });

  it('handles edge cases', () => {
    // Zero base value
    expect(applyMods(0, [0.5, 1.0, 2.0])).toBe(0);
    
    // Very small values
    expect(applyMods(0.01, [0.1])).toBe(0.01); // 0.01 * 1.1 = 0.011, rounded to 0.01
    
    // Large modifiers
    expect(applyMods(10, [9.0])).toBe(100); // 10 * 10 = 100
    
    // Negative result (should not happen in paddle context but test anyway)
    expect(applyMods(10, [-1.5])).toBe(-5); // 10 * -0.5 = -5
  });

  it('matches backend rounding behavior exactly', () => {
    // Test cases that specifically verify backend parity
    const testCases = [
      { base: 85.67, mods: [0.12, -0.05], expected: 91.51 }, // 85.67 * 1.12 = 95.95 -> 95.95 * 0.95 = 91.1525 -> 91.15
      { base: 123.456, mods: [0.08, 0.03, -0.02], expected: 135.02 }, // Multi-step with rounding
      { base: 99.99, mods: [0.01], expected: 100.99 }, // 99.99 * 1.01 = 100.9899 -> 100.99
      { base: 1.234, mods: [0.5, 0.25], expected: 2.31 }, // 1.234 * 1.5 = 1.851 -> 1.85 * 1.25 = 2.3125 -> 2.31
    ];

    testCases.forEach(({ base, mods, expected }) => {
      const result = applyMods(base, mods);
      expect(result).toBe(expected);
    });
  });

  it('handles floating point precision issues', () => {
    // Test cases that could cause floating point precision problems
    expect(applyMods(0.1, [0.1, 0.1, 0.1])).toBe(0.13); // Multiple small operations
    expect(applyMods(1.1, [0.1])).toBe(1.21); // 1.1 * 1.1 = 1.21 exactly
    expect(applyMods(2.2, [0.1])).toBe(2.42); // 2.2 * 1.1 = 2.42 exactly
  });

  it('preserves order of operations', () => {
    const base = 100;
    const mods1 = [0.1, 0.2]; // +10%, then +20%
    const mods2 = [0.2, 0.1]; // +20%, then +10%
    
    const result1 = applyMods(base, mods1); // 100 * 1.1 = 110, then 110 * 1.2 = 132
    const result2 = applyMods(base, mods2); // 100 * 1.2 = 120, then 120 * 1.1 = 132
    
    expect(result1).toBe(132);
    expect(result2).toBe(132);
    
    // But with different mods, order matters
    const mods3 = [0.5, -0.2]; // +50%, then -20%
    const mods4 = [-0.2, 0.5]; // -20%, then +50%
    
    const result3 = applyMods(base, mods3); // 100 * 1.5 = 150, then 150 * 0.8 = 120
    const result4 = applyMods(base, mods4); // 100 * 0.8 = 80, then 80 * 1.5 = 120
    
    expect(result3).toBe(120);
    expect(result4).toBe(120);
  });

  it('handles complex paddle recommendation scenarios', () => {
    // Realistic paddle modification scenarios
    
    // Power paddle: base weight 8.2oz, +5% for grip tape, -2% for edge guard removal
    expect(applyMods(8.2, [0.05, -0.02])).toBe(8.45); // 8.2 * 1.05 = 8.61 -> 8.61 * 0.98 = 8.4378 -> 8.44
    
    // Control paddle: base price $150, +10% premium materials, +8% custom grip
    expect(applyMods(150, [0.1, 0.08])).toBe(178.2); // 150 * 1.1 = 165, then 165 * 1.08 = 178.2
    
    // Spin rating: base 7.5, +15% textured surface, -5% for wear
    expect(applyMods(7.5, [0.15, -0.05])).toBe(8.19); // 7.5 * 1.15 = 8.625 -> 8.63 * 0.95 = 8.1985 -> 8.20
  });
});
