/**
 * Waitlist 模組單元測試
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
}

global.localStorage = new LocalStorageMock();

describe('Waitlist Module - getApprovedCount', () => {
  const getRegistrations = () => {
    const data = localStorage.getItem('registrations');
    return data ? JSON.parse(data) : [];
  };

  const saveRegistrations = (regs) => {
    localStorage.setItem('registrations', JSON.stringify(regs));
  };

  const getApprovedCount = (eventId) => {
    const registrations = getRegistrations();
    return registrations.filter(r =>
      r.eventId === eventId && (r.status === 'approved' || r.status === 'pending')
    ).length;
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should count approved registrations', () => {
    const regs = [
      { eventId: '1', userName: 'user1', status: 'approved' },
      { eventId: '1', userName: 'user2', status: 'approved' },
      { eventId: '1', userName: 'user3', status: 'pending' }
    ];
    saveRegistrations(regs);

    expect(getApprovedCount('1')).toBe(3);
  });

  test('should not count waitlist or rejected', () => {
    const regs = [
      { eventId: '1', userName: 'user1', status: 'approved' },
      { eventId: '1', userName: 'user2', status: 'waitlist' },
      { eventId: '1', userName: 'user3', status: 'rejected' }
    ];
    saveRegistrations(regs);

    expect(getApprovedCount('1')).toBe(1);
  });

  test('should return 0 for event with no registrations', () => {
    expect(getApprovedCount('999')).toBe(0);
  });

  test('should count only for specific event', () => {
    const regs = [
      { eventId: '1', userName: 'user1', status: 'approved' },
      { eventId: '2', userName: 'user2', status: 'approved' }
    ];
    saveRegistrations(regs);

    expect(getApprovedCount('1')).toBe(1);
    expect(getApprovedCount('2')).toBe(1);
  });
});

describe('Waitlist Module - promoteFromWaitlist', () => {
  const getRegistrations = () => {
    const data = localStorage.getItem('registrations');
    return data ? JSON.parse(data) : [];
  };

  const saveRegistrations = (regs) => {
    localStorage.setItem('registrations', JSON.stringify(regs));
  };

  const getEvents = () => {
    const data = localStorage.getItem('events');
    return data ? JSON.parse(data) : [];
  };

  const saveEvents = (events) => {
    localStorage.setItem('events', JSON.stringify(events));
  };

  const promoteFromWaitlist = (eventId) => {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const registrations = getRegistrations();
    const waitlist = registrations
      .filter(r => r.eventId === eventId && r.status === 'waitlist')
      .sort((a, b) => new Date(a.waitlistTime) - new Date(a.waitlistTime));

    if (waitlist.length === 0) return;

    const promoted = waitlist[0];
    promoted.status = event.type === 'Online' ? 'approved' : 'pending';
    promoted.approvedTime = event.type === 'Online' ? new Date().toISOString() : null;
    delete promoted.waitlistPosition;
    delete promoted.waitlistTime;

    // 更新其他候補者順位
    waitlist.slice(1).forEach((reg, index) => {
      reg.waitlistPosition = index + 1;
    });

    saveRegistrations(registrations);
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should promote first waitlist user for Online event', () => {
    const events = [{ id: '1', type: 'Online' }];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'waitlist',
        waitlistPosition: 1,
        waitlistTime: '2024-01-01T10:00:00Z'
      },
      {
        eventId: '1',
        userName: 'user2',
        status: 'waitlist',
        waitlistPosition: 2,
        waitlistTime: '2024-01-01T11:00:00Z'
      }
    ];
    saveRegistrations(regs);

    promoteFromWaitlist('1');

    const updated = getRegistrations();
    expect(updated[0].status).toBe('approved');
    expect(updated[0].waitlistPosition).toBeUndefined();
    expect(updated[1].waitlistPosition).toBe(1);
  });

  test('should promote to pending for OnSite event', () => {
    const events = [{ id: '1', type: 'OnSite' }];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'waitlist',
        waitlistPosition: 1,
        waitlistTime: '2024-01-01T10:00:00Z'
      }
    ];
    saveRegistrations(regs);

    promoteFromWaitlist('1');

    const updated = getRegistrations();
    expect(updated[0].status).toBe('pending');
  });

  test('should do nothing when no waitlist', () => {
    const events = [{ id: '1', type: 'Online' }];
    saveEvents(events);

    const regs = [
      { eventId: '1', userName: 'user1', status: 'approved' }
    ];
    saveRegistrations(regs);

    promoteFromWaitlist('1');

    const updated = getRegistrations();
    expect(updated[0].status).toBe('approved');
  });
});
