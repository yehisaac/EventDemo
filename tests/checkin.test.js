/**
 * Checkin 模組單元測試
 * Event Management System v3.2.0
 */

import { describe, test, expect } from '@jest/globals';

describe('Checkin Module - generateCheckinCode', () => {
  const generateCheckinCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  test('should generate 6-character code', () => {
    const code = generateCheckinCode();
    expect(code.length).toBe(6);
  });

  test('should only contain valid characters', () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = generateCheckinCode();

    for (let char of code) {
      expect(validChars.includes(char)).toBe(true);
    }
  });

  test('should generate different codes', () => {
    const code1 = generateCheckinCode();
    const code2 = generateCheckinCode();

    // 雖然理論上可能相同，但機率極低
    // 這個測試可能偶爾失敗，但作為參考
    expect(code1).not.toBe(code2);
  });

  test('should be uppercase', () => {
    const code = generateCheckinCode();
    expect(code).toBe(code.toUpperCase());
  });
});

describe('Checkin Module - isCheckinCodeValid', () => {
  const isCheckinCodeValid = (event) => {
    if (!event.currentCheckinCode) return false;

    const generatedAt = new Date(event.currentCheckinCode.generatedAt);
    const now = new Date();
    const elapsedSeconds = (now - generatedAt) / 1000;

    return elapsedSeconds <= 30;
  };

  test('should return false when no checkin code', () => {
    const event = { id: '1', type: 'OnSite' };
    expect(isCheckinCodeValid(event)).toBe(false);
  });

  test('should return true for valid code (just generated)', () => {
    const event = {
      id: '1',
      type: 'OnSite',
      currentCheckinCode: {
        code: 'ABC123',
        generatedAt: new Date().toISOString()
      }
    };

    expect(isCheckinCodeValid(event)).toBe(true);
  });

  test('should return false for expired code', () => {
    const pastTime = new Date();
    pastTime.setSeconds(pastTime.getSeconds() - 35);

    const event = {
      id: '1',
      type: 'OnSite',
      currentCheckinCode: {
        code: 'ABC123',
        generatedAt: pastTime.toISOString()
      }
    };

    expect(isCheckinCodeValid(event)).toBe(false);
  });

  test('should return true for code within 30 seconds', () => {
    const recentTime = new Date();
    recentTime.setSeconds(recentTime.getSeconds() - 20);

    const event = {
      id: '1',
      type: 'OnSite',
      currentCheckinCode: {
        code: 'ABC123',
        generatedAt: recentTime.toISOString()
      }
    };

    expect(isCheckinCodeValid(event)).toBe(true);
  });
});

describe('Checkin Module - validateCheckinCode', () => {
  const getEvents = () => {
    return [
      {
        id: '1',
        type: 'OnSite',
        currentCheckinCode: {
          code: 'ABC123',
          generatedAt: new Date().toISOString()
        }
      }
    ];
  };

  const isCheckinCodeValid = (event) => {
    if (!event.currentCheckinCode) return false;
    const generatedAt = new Date(event.currentCheckinCode.generatedAt);
    const now = new Date();
    const elapsedSeconds = (now - generatedAt) / 1000;
    return elapsedSeconds <= 30;
  };

  const validateCheckinCode = (eventId, inputCode) => {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    if (!isCheckinCodeValid(event)) return false;

    return event.currentCheckinCode.code.toUpperCase() === inputCode.toUpperCase();
  };

  test('should validate correct code', () => {
    expect(validateCheckinCode('1', 'ABC123')).toBe(true);
  });

  test('should validate case-insensitive', () => {
    expect(validateCheckinCode('1', 'abc123')).toBe(true);
    expect(validateCheckinCode('1', 'AbC123')).toBe(true);
  });

  test('should reject wrong code', () => {
    expect(validateCheckinCode('1', 'WRONG1')).toBe(false);
  });

  test('should reject for non-existent event', () => {
    expect(validateCheckinCode('999', 'ABC123')).toBe(false);
  });
});
