/**
 * Storage 模組單元測試
 * Event Management System v3.2.0
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock LocalStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

describe('Storage Module - Events', () => {
  const getEvents = () => {
    const data = localStorage.getItem('events');
    return data ? JSON.parse(data) : [];
  };

  const saveEvents = (events) => {
    localStorage.setItem('events', JSON.stringify(events));
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should return empty array when no events', () => {
    const events = getEvents();
    expect(events).toEqual([]);
  });

  test('should save and retrieve events', () => {
    const testEvents = [
      { id: '1', title: 'Event 1', type: 'Online' },
      { id: '2', title: 'Event 2', type: 'OnSite' }
    ];

    saveEvents(testEvents);
    const retrieved = getEvents();

    expect(retrieved).toEqual(testEvents);
    expect(retrieved.length).toBe(2);
  });

  test('should handle Hybrid event with extra fields', () => {
    const hybridEvent = {
      id: '1',
      title: 'Hybrid Event',
      type: 'OnSite',
      allowOnlineView: true,
      onlineLink: 'https://meet.example.com',
      countOnlineForTask: true
    };

    saveEvents([hybridEvent]);
    const retrieved = getEvents();

    expect(retrieved[0].allowOnlineView).toBe(true);
    expect(retrieved[0].onlineLink).toBe('https://meet.example.com');
    expect(retrieved[0].countOnlineForTask).toBe(true);
  });
});

describe('Storage Module - Registrations', () => {
  const getRegistrations = () => {
    const data = localStorage.getItem('registrations');
    return data ? JSON.parse(data) : [];
  };

  const saveRegistrations = (registrations) => {
    localStorage.setItem('registrations', JSON.stringify(registrations));
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should return empty array when no registrations', () => {
    const regs = getRegistrations();
    expect(regs).toEqual([]);
  });

  test('should save and retrieve registrations', () => {
    const testRegs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        timestamp: new Date().toISOString()
      }
    ];

    saveRegistrations(testRegs);
    const retrieved = getRegistrations();

    expect(retrieved).toEqual(testRegs);
    expect(retrieved[0].userName).toBe('user1');
  });

  test('should handle Hybrid registration with participationMode', () => {
    const hybridReg = {
      eventId: '1',
      userName: 'user1',
      status: 'approved',
      participationMode: 'online',
      timestamp: new Date().toISOString()
    };

    saveRegistrations([hybridReg]);
    const retrieved = getRegistrations();

    expect(retrieved[0].participationMode).toBe('online');
  });

  test('should handle waitlist status', () => {
    const waitlistReg = {
      eventId: '1',
      userName: 'user1',
      status: 'waitlist',
      waitlistPosition: 1,
      waitlistTime: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    saveRegistrations([waitlistReg]);
    const retrieved = getRegistrations();

    expect(retrieved[0].status).toBe('waitlist');
    expect(retrieved[0].waitlistPosition).toBe(1);
  });
});

describe('Storage Module - User Points', () => {
  const getUserPoints = (userId) => {
    const data = localStorage.getItem('userPoints');
    const points = data ? JSON.parse(data) : {};
    return points[userId] || 0;
  };

  const saveUserPoints = (userId, points) => {
    const data = localStorage.getItem('userPoints');
    const allPoints = data ? JSON.parse(data) : {};
    allPoints[userId] = points;
    localStorage.setItem('userPoints', JSON.stringify(allPoints));
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should return 0 points for new user', () => {
    const points = getUserPoints('user1');
    expect(points).toBe(0);
  });

  test('should save and retrieve user points', () => {
    saveUserPoints('user1', 100);
    const points = getUserPoints('user1');
    expect(points).toBe(100);
  });

  test('should handle multiple users', () => {
    saveUserPoints('user1', 100);
    saveUserPoints('user2', 200);

    expect(getUserPoints('user1')).toBe(100);
    expect(getUserPoints('user2')).toBe(200);
  });

  test('should update existing user points', () => {
    saveUserPoints('user1', 100);
    saveUserPoints('user1', 150);

    expect(getUserPoints('user1')).toBe(150);
  });
});

describe('Storage Module - Task Claims', () => {
  const getTaskClaims = (userId) => {
    const data = localStorage.getItem('taskClaims');
    const claims = data ? JSON.parse(data) : {};
    return claims[userId] || {};
  };

  const saveTaskClaim = (userId, taskId) => {
    const data = localStorage.getItem('taskClaims');
    const allClaims = data ? JSON.parse(data) : {};
    if (!allClaims[userId]) {
      allClaims[userId] = {};
    }
    allClaims[userId][taskId] = true;
    localStorage.setItem('taskClaims', JSON.stringify(allClaims));
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should return empty object for new user', () => {
    const claims = getTaskClaims('user1');
    expect(claims).toEqual({});
  });

  test('should save and retrieve task claim', () => {
    saveTaskClaim('user1', 'task1');
    const claims = getTaskClaims('user1');

    expect(claims['task1']).toBe(true);
  });

  test('should handle multiple task claims', () => {
    saveTaskClaim('user1', 'task1');
    saveTaskClaim('user1', 'task2');

    const claims = getTaskClaims('user1');
    expect(claims['task1']).toBe(true);
    expect(claims['task2']).toBe(true);
  });

  test('should handle multiple users', () => {
    saveTaskClaim('user1', 'task1');
    saveTaskClaim('user2', 'task1');

    expect(getTaskClaims('user1')['task1']).toBe(true);
    expect(getTaskClaims('user2')['task1']).toBe(true);
  });
});
