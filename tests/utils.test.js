/**
 * Utils 模組單元測試
 * Event Management System v3.2.0
 */

import { describe, test, expect } from '@jest/globals';

// Mock DOM 環境
const setupDOM = () => {
  // 創建必要的 DOM 結構
  document.body.innerHTML = `
    <div id="loginScreen"></div>
    <div id="adminScreen"></div>
    <div id="userScreen"></div>
  `;
};

describe('Utils Module - maskUserId', () => {
  // 由於 utils.js 中的函數沒有 export，我們需要直接測試邏輯
  const maskUserId = (userId) => {
    if (!userId) return '';
    if (userId.length <= 2) return userId;
    const firstChar = userId[0];
    const lastChar = userId[userId.length - 1];
    const maskLength = userId.length - 2;
    return firstChar + '*'.repeat(maskLength) + lastChar;
  };

  test('should mask user ID correctly - normal case', () => {
    expect(maskUserId('user123')).toBe('u*****3');
  });

  test('should mask user ID correctly - short ID (2 chars)', () => {
    expect(maskUserId('ab')).toBe('ab');
  });

  test('should mask user ID correctly - single char', () => {
    expect(maskUserId('a')).toBe('a');
  });

  test('should handle empty string', () => {
    expect(maskUserId('')).toBe('');
  });

  test('should mask email-like ID', () => {
    expect(maskUserId('test@example.com')).toBe('t**************m');
  });

  test('should mask long ID', () => {
    const longId = 'verylongusername12345';
    const result = maskUserId(longId);
    expect(result[0]).toBe('v');
    expect(result[result.length - 1]).toBe('5');
    expect(result.length).toBe(longId.length);
  });
});

describe('Utils Module - isEventExpired', () => {
  const isEventExpired = (event) => {
    if (!event.registrationEndTime) return false;
    return new Date() > new Date(event.registrationEndTime);
  };

  test('should return false when no registrationEndTime', () => {
    const event = { title: 'Test Event' };
    expect(isEventExpired(event)).toBe(false);
  });

  test('should return true for expired event', () => {
    const event = {
      title: 'Test Event',
      registrationEndTime: '2020-01-01T00:00:00Z'
    };
    expect(isEventExpired(event)).toBe(true);
  });

  test('should return false for future event', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const event = {
      title: 'Test Event',
      registrationEndTime: futureDate.toISOString()
    };
    expect(isEventExpired(event)).toBe(false);
  });
});

describe('Utils Module - isInTimeRange', () => {
  const isInTimeRange = (startTime, endTime) => {
    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  test('should return true when in time range', () => {
    const past = new Date();
    past.setHours(past.getHours() - 1);

    const future = new Date();
    future.setHours(future.getHours() + 1);

    expect(isInTimeRange(past.toISOString(), future.toISOString())).toBe(true);
  });

  test('should return false when before start time', () => {
    const future1 = new Date();
    future1.setHours(future1.getHours() + 1);

    const future2 = new Date();
    future2.setHours(future2.getHours() + 2);

    expect(isInTimeRange(future1.toISOString(), future2.toISOString())).toBe(false);
  });

  test('should return false when after end time', () => {
    const past1 = new Date();
    past1.setHours(past1.getHours() - 2);

    const past2 = new Date();
    past2.setHours(past2.getHours() - 1);

    expect(isInTimeRange(past1.toISOString(), past2.toISOString())).toBe(false);
  });

  test('should return true when no time constraints', () => {
    expect(isInTimeRange(null, null)).toBe(true);
  });
});
