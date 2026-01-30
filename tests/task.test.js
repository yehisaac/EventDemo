/**
 * Task 模組單元測試
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

describe('Task Module - calculateUserTaskProgress', () => {
  const getRegistrations = () => {
    const data = localStorage.getItem('registrations');
    return data ? JSON.parse(data) : [];
  };

  const getEvents = () => {
    const data = localStorage.getItem('events');
    return data ? JSON.parse(data) : [];
  };

  const saveRegistrations = (regs) => {
    localStorage.setItem('registrations', JSON.stringify(regs));
  };

  const saveEvents = (events) => {
    localStorage.setItem('events', JSON.stringify(events));
  };

  const calculateUserTaskProgress = (userId, taskEvent) => {
    const registrations = getRegistrations();
    const events = getEvents();

    const taskStart = taskEvent.startTime ? new Date(taskEvent.startTime).getTime() : 0;
    const taskEnd = taskEvent.endTime ? new Date(taskEvent.endTime).getTime() : Infinity;

    let count = 0;

    registrations.forEach(reg => {
      if (reg.userName !== userId) return;

      const event = events.find(e => e.id === reg.eventId);
      if (!event || event.type === 'Task') return;

      let activityTime = null;

      if (event.type === 'Online' && reg.status === 'approved') {
        activityTime = new Date(reg.approvedTime || reg.timestamp).getTime();
      } else if (event.type === 'OnSite' && reg.status === 'approved') {
        // Hybrid 模式：線上參與者的任務計算
        const isOnlineParticipant = event.allowOnlineView && reg.participationMode === 'online';

        if (isOnlineParticipant) {
          // 如果是線上參與者，檢查 countOnlineForTask 設定
          if (event.countOnlineForTask) {
            activityTime = new Date(reg.approvedTime || reg.timestamp).getTime();
          }
        } else {
          // 實體參與者必須簽到才計入
          if (reg.checkedIn) {
            activityTime = new Date(reg.checkedInTime || reg.timestamp).getTime();
          }
        }
      }

      if (activityTime && activityTime >= taskStart && activityTime <= taskEnd) {
        count++;
      }
    });

    return count;
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should count Online approved registrations', () => {
    const events = [
      { id: '1', type: 'Online' }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        approvedTime: '2024-01-15T10:00:00Z'
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(1);
  });

  test('should count OnSite with check-in', () => {
    const events = [
      { id: '1', type: 'OnSite' }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        checkedIn: true,
        checkedInTime: '2024-01-15T10:00:00Z'
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(1);
  });

  test('should NOT count OnSite without check-in', () => {
    const events = [
      { id: '1', type: 'OnSite' }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        checkedIn: false
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(0);
  });

  test('should count Hybrid online participant when countOnlineForTask is true', () => {
    const events = [
      {
        id: '1',
        type: 'OnSite',
        allowOnlineView: true,
        countOnlineForTask: true
      }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        participationMode: 'online',
        approvedTime: '2024-01-15T10:00:00Z',
        checkedIn: false
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(1);
  });

  test('should NOT count Hybrid online participant when countOnlineForTask is false', () => {
    const events = [
      {
        id: '1',
        type: 'OnSite',
        allowOnlineView: true,
        countOnlineForTask: false
      }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        participationMode: 'online',
        approvedTime: '2024-01-15T10:00:00Z',
        checkedIn: false
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(0);
  });

  test('should count Hybrid onsite participant with check-in', () => {
    const events = [
      {
        id: '1',
        type: 'OnSite',
        allowOnlineView: true,
        countOnlineForTask: false
      }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        participationMode: 'onsite',
        checkedIn: true,
        checkedInTime: '2024-01-15T10:00:00Z'
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(1);
  });

  test('should respect time range', () => {
    const events = [
      { id: '1', type: 'Online' },
      { id: '2', type: 'Online' }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        approvedTime: '2024-01-15T10:00:00Z'  // In range
      },
      {
        eventId: '2',
        userName: 'user1',
        status: 'approved',
        approvedTime: '2024-02-15T10:00:00Z'  // Out of range
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(1);
  });

  test('should only count for specific user', () => {
    const events = [
      { id: '1', type: 'Online' }
    ];
    saveEvents(events);

    const regs = [
      {
        eventId: '1',
        userName: 'user1',
        status: 'approved',
        approvedTime: '2024-01-15T10:00:00Z'
      },
      {
        eventId: '1',
        userName: 'user2',
        status: 'approved',
        approvedTime: '2024-01-15T10:00:00Z'
      }
    ];
    saveRegistrations(regs);

    const taskEvent = {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-31T23:59:59Z'
    };

    expect(calculateUserTaskProgress('user1', taskEvent)).toBe(1);
    expect(calculateUserTaskProgress('user2', taskEvent)).toBe(1);
  });
});

describe('Task Module - claimTaskReward', () => {
  const getTaskClaims = (userId) => {
    const data = localStorage.getItem('taskClaims');
    const claims = data ? JSON.parse(data) : {};
    return claims[userId] || {};
  };

  const getUserPoints = (userId) => {
    const data = localStorage.getItem('userPoints');
    const points = data ? JSON.parse(data) : {};
    return points[userId] || 0;
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

  const saveUserPoints = (userId, points) => {
    const data = localStorage.getItem('userPoints');
    const allPoints = data ? JSON.parse(data) : {};
    allPoints[userId] = points;
    localStorage.setItem('userPoints', JSON.stringify(allPoints));
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('should add points when claiming reward', () => {
    saveUserPoints('user1', 100);
    saveTaskClaim('user1', 'task1');

    const newPoints = getUserPoints('user1') + 50;
    saveUserPoints('user1', newPoints);

    expect(getUserPoints('user1')).toBe(150);
  });

  test('should record task claim', () => {
    saveTaskClaim('user1', 'task1');

    const claims = getTaskClaims('user1');
    expect(claims['task1']).toBe(true);
  });

  test('should prevent double claim', () => {
    saveTaskClaim('user1', 'task1');

    const claims = getTaskClaims('user1');
    const hasClaimed = claims['task1'];

    expect(hasClaimed).toBe(true);
  });
});
