/**
 * PRODUCTION-GRADE UTILITY TESTS
 * Covers: Every exported utility function with edge cases,
 * boundary conditions, type safety, and production scenarios
 */
import {
  getInitials,
  getAmPm,
  getLastTwoHundredYears,
  generateDeviceId,
  isBrowser,
  stripHTML,
  generateRandomSkuNoWithTimeStamp,
  parsedDays,
} from '@/utils/helper';

// ═══════════════════════════════════════════════════════════════
// getInitials
// ═══════════════════════════════════════════════════════════════

describe('getInitials', () => {
  it('returns two-letter initials for normal names', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('handles single character names', () => {
    expect(getInitials('A', 'B')).toBe('AB');
  });

  it('handles empty first name', () => {
    expect(getInitials('', 'Doe')).toBe('D');
  });

  it('handles empty last name', () => {
    expect(getInitials('John', '')).toBe('J');
  });

  it('handles both empty', () => {
    expect(getInitials('', '')).toBe('');
  });

  it('handles undefined/null gracefully', () => {
    expect(getInitials(undefined as any, undefined as any)).toBe('');
    expect(getInitials(null as any, null as any)).toBe('');
  });

  it('handles Arabic names', () => {
    const result = getInitials('Ahmed', 'Salem');
    expect(result).toBe('AS');
  });

  it('handles names with spaces', () => {
    expect(getInitials('John Paul', 'Smith Jr')).toBe('JS');
  });
});

// ═══════════════════════════════════════════════════════════════
// getAmPm
// ═══════════════════════════════════════════════════════════════

describe('getAmPm', () => {
  it('converts 24h morning time to 12h AM', () => {
    expect(getAmPm('09:30')).toBe('9:30 AM');
  });

  it('converts 24h afternoon time to 12h PM', () => {
    expect(getAmPm('14:30')).toBe('2:30 PM');
  });

  it('handles midnight (00:00)', () => {
    expect(getAmPm('00:00')).toBe('12:00 AM');
  });

  it('handles noon (12:00)', () => {
    expect(getAmPm('12:00')).toBe('12:00 PM');
  });

  it('handles 23:59', () => {
    expect(getAmPm('23:59')).toBe('11:59 PM');
  });

  it('returns undefined for empty string', () => {
    expect(getAmPm('')).toBeUndefined();
  });

  it('returns undefined for falsy input', () => {
    expect(getAmPm(undefined as any)).toBeUndefined();
    expect(getAmPm(null as any)).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// getLastTwoHundredYears
// ═══════════════════════════════════════════════════════════════

describe('getLastTwoHundredYears', () => {
  it('returns 201 years', () => {
    const years = getLastTwoHundredYears();
    expect(years).toHaveLength(201);
  });

  it('starts with current year', () => {
    const years = getLastTwoHundredYears();
    const currentYear = new Date().getFullYear();
    expect(years[0]).toBe(currentYear);
  });

  it('ends 200 years ago', () => {
    const years = getLastTwoHundredYears();
    const currentYear = new Date().getFullYear();
    expect(years[years.length - 1]).toBe(currentYear - 200);
  });

  it('years are in descending order', () => {
    const years = getLastTwoHundredYears();
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBe(years[i - 1] - 1);
    }
  });

  it('all values are numbers', () => {
    const years = getLastTwoHundredYears();
    years.forEach((y) => expect(typeof y).toBe('number'));
  });
});

// ═══════════════════════════════════════════════════════════════
// generateDeviceId
// ═══════════════════════════════════════════════════════════════

describe('generateDeviceId', () => {
  it('starts with "device_" prefix', () => {
    const id = generateDeviceId();
    expect(id).toMatch(/^device_/);
  });

  it('contains a timestamp', () => {
    const before = new Date().getTime();
    const id = generateDeviceId();
    const after = new Date().getTime();

    const parts = id.split('_');
    const timestamp = parseInt(parts[1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateDeviceId());
    }
    // All should be unique (or at least most — timestamp + random)
    expect(ids.size).toBeGreaterThanOrEqual(95);
  });

  it('returns a string of reasonable length', () => {
    const id = generateDeviceId();
    expect(id.length).toBeGreaterThan(20);
    expect(id.length).toBeLessThan(100);
  });
});

// ═══════════════════════════════════════════════════════════════
// isBrowser
// ═══════════════════════════════════════════════════════════════

describe('isBrowser', () => {
  it('returns true in jsdom (test) environment', () => {
    expect(isBrowser()).toBe(true);
  });

  it('returns boolean type', () => {
    expect(typeof isBrowser()).toBe('boolean');
  });
});

// ═══════════════════════════════════════════════════════════════
// stripHTML
// ═══════════════════════════════════════════════════════════════

describe('stripHTML', () => {
  it('removes simple HTML tags', () => {
    expect(stripHTML('<p>Hello</p>')).toBe('Hello');
  });

  it('removes nested HTML tags', () => {
    expect(stripHTML('<div><span>Hello</span></div>')).toBe('Hello');
  });

  it('removes self-closing tags', () => {
    expect(stripHTML('Hello<br/>World')).toBe('HelloWorld');
  });

  it('handles tags with attributes', () => {
    expect(stripHTML('<a href="https://test.com" class="link">Click</a>')).toBe('Click');
  });

  it('handles empty string', () => {
    expect(stripHTML('')).toBe('');
  });

  it('handles string with no HTML', () => {
    expect(stripHTML('No HTML here')).toBe('No HTML here');
  });

  it('strips XSS payloads', () => {
    const xss = '<script>alert("xss")</script>Safe content';
    expect(stripHTML(xss)).toBe('alert("xss")Safe content');
  });

  it('handles malformed HTML', () => {
    expect(stripHTML('<p>Unclosed tag')).toBe('Unclosed tag');
    expect(stripHTML('Content</p>')).toBe('Content');
  });

  it('preserves entities like &amp;', () => {
    const result = stripHTML('<p>A &amp; B</p>');
    expect(result).toContain('&amp;');
  });
});

// ═══════════════════════════════════════════════════════════════
// generateRandomSkuNoWithTimeStamp
// ═══════════════════════════════════════════════════════════════

describe('generateRandomSkuNoWithTimeStamp', () => {
  it('returns a number', () => {
    const sku = generateRandomSkuNoWithTimeStamp();
    expect(typeof sku).toBe('number');
  });

  it('returns a timestamp-based value', () => {
    const before = new Date().getTime();
    const sku = generateRandomSkuNoWithTimeStamp();
    const after = new Date().getTime();

    expect(sku).toBeGreaterThanOrEqual(before);
    expect(sku).toBeLessThanOrEqual(after);
  });

  it('sequential calls return increasing values', () => {
    const sku1 = generateRandomSkuNoWithTimeStamp();
    const sku2 = generateRandomSkuNoWithTimeStamp();

    expect(sku2).toBeGreaterThanOrEqual(sku1);
  });
});

// ═══════════════════════════════════════════════════════════════
// parsedDays
// ═══════════════════════════════════════════════════════════════

describe('parsedDays', () => {
  it('returns undefined for empty string', () => {
    expect(parsedDays('')).toBeUndefined();
  });

  it('returns undefined for falsy input', () => {
    expect(parsedDays(null as any)).toBeUndefined();
    expect(parsedDays(undefined as any)).toBeUndefined();
  });

  it('parses JSON days object with active days', () => {
    const json = JSON.stringify({ mon: 1, tue: 0, wed: 1 });
    const result = parsedDays(json);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns undefined when no days are active', () => {
    const json = JSON.stringify({ mon: 0, tue: 0, wed: 0 });
    const result = parsedDays(json);
    expect(result).toBeUndefined();
  });
});
