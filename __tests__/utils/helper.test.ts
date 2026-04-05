jest.mock('country-codes-list', () => ({
  __esModule: true,
  default: { customList: jest.fn(() => ({})) },
  CountryProperty: {},
}));

import {
  getInitials,
  getAmPm,
  parsedDays,
  stripHTML,
  formatDate,
  capitalizeWord,
  formatPrice,
  isVideo,
  isImage,
  generateUniqueNumber,
  convertDateTime,
  convertDate,
  convertTime,
  convertDateTimeToUTC,
  getLastTwoHundredYears,
  isBrowser,
  generateDeviceId,
  handleDescriptionParse,
  generateRandomSkuNoWithTimeStamp,
} from '@/utils/helper';

describe('Helper Utilities', () => {
  describe('getInitials', () => {
    it('returns initials from first and last name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD');
    });

    it('returns single initial when one name is empty', () => {
      expect(getInitials('John', '')).toBe('J');
      expect(getInitials('', 'Doe')).toBe('D');
    });

    it('handles undefined/null gracefully', () => {
      expect(getInitials(undefined as any, undefined as any)).toBe('');
    });

    it('uses first character only', () => {
      expect(getInitials('Alice', 'Bob')).toBe('AB');
    });
  });

  describe('getAmPm', () => {
    it('converts morning time', () => {
      expect(getAmPm('09:30')).toBe('9:30 AM');
    });

    it('converts afternoon time', () => {
      expect(getAmPm('14:45')).toBe('2:45 PM');
    });

    it('handles noon (12:00)', () => {
      expect(getAmPm('12:00')).toBe('12:00 PM');
    });

    it('handles midnight (00:00)', () => {
      expect(getAmPm('00:00')).toBe('12:00 AM');
    });

    it('returns undefined for empty input', () => {
      expect(getAmPm('')).toBeUndefined();
    });
  });

  describe('parsedDays', () => {
    it('returns day names for active days', () => {
      const data = JSON.stringify({ sun: 1, mon: 1, tue: 0 });
      expect(parsedDays(data)).toEqual(['sunday', 'monday']);
    });

    it('returns undefined when all days are 0', () => {
      const data = JSON.stringify({ sun: 0, mon: 0 });
      expect(parsedDays(data)).toBeUndefined();
    });

    it('returns undefined for empty/null input', () => {
      expect(parsedDays('')).toBeUndefined();
      expect(parsedDays(null as any)).toBeUndefined();
    });
  });

  describe('stripHTML', () => {
    it('removes HTML tags', () => {
      expect(stripHTML('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('returns plain text as-is', () => {
      expect(stripHTML('no tags here')).toBe('no tags here');
    });

    it('handles nested tags', () => {
      expect(stripHTML('<div><span>text</span></div>')).toBe('text');
    });

    it('handles empty string', () => {
      expect(stripHTML('')).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string', () => {
      const result = formatDate('2024-06-10T00:00:00.000Z');
      expect(result).toMatch(/Jun/);
      expect(result).toMatch(/2024/);
    });

    it('returns dash for undefined', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('returns dash for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('-');
    });
  });

  describe('capitalizeWord', () => {
    it('capitalizes first letter', () => {
      expect(capitalizeWord('hello')).toBe('Hello');
    });

    it('lowercases rest of the word', () => {
      expect(capitalizeWord('HELLO')).toBe('Hello');
    });

    it('returns empty string for empty input', () => {
      expect(capitalizeWord('')).toBe('');
    });

    it('handles single character', () => {
      expect(capitalizeWord('a')).toBe('A');
    });
  });

  describe('formatPrice', () => {
    it('formats price with default dollar symbol', () => {
      expect(formatPrice(1234.5)).toBe('$1,234.50');
    });

    it('uses custom currency symbol', () => {
      expect(formatPrice(100, '€')).toBe('€100.00');
    });

    it('returns empty string for zero/falsy price', () => {
      expect(formatPrice(0)).toBe('');
    });

    it('formats large numbers with commas', () => {
      expect(formatPrice(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('isVideo', () => {
    it('returns true for video extensions', () => {
      expect(isVideo('file.mp4')).toBe(true);
      expect(isVideo('file.mkv')).toBe(true);
      expect(isVideo('file.avi')).toBe(true);
    });

    it('returns false for non-video extensions', () => {
      expect(isVideo('file.jpg')).toBe(false);
      expect(isVideo('file.txt')).toBe(false);
    });

    it('returns true for object type', () => {
      expect(isVideo({} as any)).toBe(true);
    });
  });

  describe('isImage', () => {
    it('returns true for image extensions', () => {
      expect(isImage('photo.jpg')).toBe(true);
      expect(isImage('photo.png')).toBe(true);
      expect(isImage('photo.gif')).toBe(true);
    });

    it('returns false for non-image extensions', () => {
      expect(isImage('file.mp4')).toBe(false);
      expect(isImage('file.txt')).toBe(false);
    });

    it('returns true for object with image type', () => {
      expect(isImage({ type: 'image/png' })).toBe(true);
    });

    it('returns undefined for object without image type', () => {
      expect(isImage({ type: 'video/mp4' })).toBeUndefined();
    });
  });

  describe('generateUniqueNumber', () => {
    it('returns a number', () => {
      expect(typeof generateUniqueNumber()).toBe('number');
    });

    it('generates different numbers on successive calls', () => {
      const a = generateUniqueNumber();
      const b = generateUniqueNumber();
      // Very unlikely to be equal due to random component
      expect(a).not.toBe(b);
    });
  });

  describe('convertDateTime', () => {
    it('formats date with time', () => {
      const result = convertDateTime('2024-06-10T14:30:00.000Z');
      expect(result).not.toBe('-');
      expect(typeof result).toBe('string');
    });

    it('returns dash for undefined', () => {
      expect(convertDateTime(undefined)).toBe('-');
    });
  });

  describe('convertDate', () => {
    it('formats date in DD/MM/YYYY', () => {
      const result = convertDate('2024-06-10T00:00:00.000Z');
      expect(result).not.toBe('-');
    });

    it('returns dash for undefined', () => {
      expect(convertDate(undefined)).toBe('-');
    });
  });

  describe('convertTime', () => {
    it('formats time', () => {
      const result = convertTime('2024-06-10T14:30:45.000Z');
      expect(result).not.toBe('-');
    });

    it('returns dash for undefined', () => {
      expect(convertTime(undefined)).toBe('-');
    });
  });

  describe('convertDateTimeToUTC', () => {
    it('converts to UTC format string', () => {
      const result = convertDateTimeToUTC('2024-06-10T14:30:45.000Z');
      expect(result).toBe('2024-06-10 14:30:45');
    });

    it('pads single-digit values', () => {
      const result = convertDateTimeToUTC('2024-01-05T03:05:09.000Z');
      expect(result).toBe('2024-01-05 03:05:09');
    });
  });

  describe('getLastTwoHundredYears', () => {
    it('returns 201 years', () => {
      const years = getLastTwoHundredYears();
      expect(years).toHaveLength(201);
    });

    it('starts with current year', () => {
      const years = getLastTwoHundredYears();
      expect(years[0]).toBe(new Date().getFullYear());
    });

    it('ends 200 years ago', () => {
      const years = getLastTwoHundredYears();
      expect(years[200]).toBe(new Date().getFullYear() - 200);
    });
  });

  describe('isBrowser', () => {
    it('returns a boolean', () => {
      expect(typeof isBrowser()).toBe('boolean');
    });
  });

  describe('generateDeviceId', () => {
    it('starts with device_ prefix', () => {
      expect(generateDeviceId()).toMatch(/^device_/);
    });

    it('generates unique ids', () => {
      expect(generateDeviceId()).not.toBe(generateDeviceId());
    });
  });

  describe('handleDescriptionParse', () => {
    it('parses valid JSON string', () => {
      expect(handleDescriptionParse('{"key":"value"}')).toEqual({ key: 'value' });
    });

    it('returns undefined for invalid JSON', () => {
      expect(handleDescriptionParse('not json')).toBeUndefined();
    });

    it('returns undefined for empty/falsy input', () => {
      expect(handleDescriptionParse('')).toBeUndefined();
    });
  });

  describe('generateRandomSkuNoWithTimeStamp', () => {
    it('returns a number (timestamp)', () => {
      expect(typeof generateRandomSkuNoWithTimeStamp()).toBe('number');
    });
  });
});
