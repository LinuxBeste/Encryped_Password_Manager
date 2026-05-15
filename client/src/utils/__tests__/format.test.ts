import { describe, it, expect } from 'vitest';
import { formatDate, formatDateFull, extractDomain, truncate, maskString, classNames } from '../format';

describe('formatDate', () => {
  it('returns "Today" for recent timestamps', () => {
    expect(formatDate(Date.now())).toBe('Today');
  });

  it('returns "Yesterday" for one day ago', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    expect(formatDate(yesterday)).toBe('Yesterday');
  });

  it('returns days ago for less than a week', () => {
    const threeDays = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(formatDate(threeDays)).toBe('3 days ago');
  });

  it('returns weeks ago for less than a month', () => {
    const twoWeeks = Date.now() - 14 * 24 * 60 * 60 * 1000;
    expect(formatDate(twoWeeks)).toBe('2 weeks ago');
  });
});

describe('formatDateFull', () => {
  it('returns a formatted date string', () => {
    const result = formatDateFull(new Date(2024, 0, 1).getTime());
    expect(result).toContain('2024');
    expect(result.length).toBeGreaterThan(10);
  });
});

describe('extractDomain', () => {
  it('extracts domain from URL', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('strips www prefix', () => {
    expect(extractDomain('https://www.google.com')).toBe('google.com');
  });

  it('returns input for invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url');
  });
});

describe('truncate', () => {
  it('returns string unchanged if within max length', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends ellipsis for long strings', () => {
    const result = truncate('hello world this is long', 10);
    expect(result).toHaveLength(10);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('maskString', () => {
  it('returns string unchanged if short enough', () => {
    expect(maskString('abc', 4)).toBe('abc');
  });

  it('masks characters beyond visible count', () => {
    expect(maskString('password', 4)).toBe('pass••••');
  });
});

describe('classNames', () => {
  it('joins truthy class names', () => {
    expect(classNames('a', 'b', false && 'c', null, undefined, 'd')).toBe('a b d');
  });

  it('returns empty string for no args', () => {
    expect(classNames()).toBe('');
  });
});
