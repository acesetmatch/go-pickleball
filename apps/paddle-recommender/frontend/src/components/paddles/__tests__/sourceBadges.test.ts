import { describe, it, expect } from 'vitest';
import { getSourceBadgeVariant } from '../sourceBadges';

describe('getSourceBadgeVariant', () => {
  it('returns default for mattspickleball', () => {
    expect(getSourceBadgeVariant('mattspickleball')).toBe('default');
  });

  it('returns secondary for pickleballeffect', () => {
    expect(getSourceBadgeVariant('pickleballeffect')).toBe('secondary');
  });

  it('returns outline for pickleballstudio', () => {
    expect(getSourceBadgeVariant('pickleballstudio')).toBe('outline');
  });

  it('returns outline for unknown source', () => {
    expect(getSourceBadgeVariant('unknown')).toBe('outline');
  });

  it('returns outline for empty string', () => {
    expect(getSourceBadgeVariant('')).toBe('outline');
  });
});
