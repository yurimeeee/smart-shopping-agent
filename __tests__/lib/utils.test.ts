import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges plain class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes (truthy)', () => {
    expect(cn('base', true && 'extra')).toBe('base extra');
  });

  it('handles conditional classes (falsy)', () => {
    expect(cn('base', false && 'extra')).toBe('base');
  });

  it('handles undefined without throwing', () => {
    expect(cn('base', undefined)).toBe('base');
  });

  it('handles null without throwing', () => {
    expect(cn('base', null)).toBe('base');
  });

  it('deduplicates conflicting Tailwind classes (tailwind-merge)', () => {
    // tailwind-merge should keep only the last conflicting class
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('merges an array of classes', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold');
  });

  it('handles object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('returns empty string when no classes provided', () => {
    expect(cn()).toBe('');
  });
});
