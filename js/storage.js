/**
 * LocalStorage 資料操作模組
 * Event Management System v3.0.0
 */

// ==================== LocalStorage 初始化 ====================
function initStorage() {
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
    if (!localStorage.getItem('registrations')) {
        localStorage.setItem('registrations', JSON.stringify([]));
    }
    if (!localStorage.getItem('userPoints')) {
        localStorage.setItem('userPoints', JSON.stringify({}));
    }
    if (!localStorage.getItem('taskClaims')) {
        localStorage.setItem('taskClaims', JSON.stringify({}));
    }
}

// ==================== Events (活動) ====================
function getEvents() {
    return JSON.parse(localStorage.getItem('events') || '[]');
}

function saveEvents(events) {
    localStorage.setItem('events', JSON.stringify(events));
}

// ==================== Registrations (報名記錄) ====================
function getRegistrations() {
    return JSON.parse(localStorage.getItem('registrations') || '[]');
}

function saveRegistrations(registrations) {
    localStorage.setItem('registrations', JSON.stringify(registrations));
}

// ==================== User Points (使用者點數) ====================
function getUserPoints(userId) {
    const points = JSON.parse(localStorage.getItem('userPoints') || '{}');
    return points[userId] || 0;
}

function saveUserPoints(userId, points) {
    const allPoints = JSON.parse(localStorage.getItem('userPoints') || '{}');
    allPoints[userId] = points;
    localStorage.setItem('userPoints', JSON.stringify(allPoints));
}

// ==================== Task Claims (任務領取記錄) ====================
function getTaskClaims(userId) {
    const claims = JSON.parse(localStorage.getItem('taskClaims') || '{}');
    return claims[userId] || {};
}

function saveTaskClaim(userId, taskId) {
    const allClaims = JSON.parse(localStorage.getItem('taskClaims') || '{}');
    if (!allClaims[userId]) {
        allClaims[userId] = {};
    }
    allClaims[userId][taskId] = true;
    localStorage.setItem('taskClaims', JSON.stringify(allClaims));
}

// ==================== 資料清除 ====================
function resetAllData() {
    if (confirm('⚠️ 確定要清除所有資料嗎？此操作無法復原！')) {
        localStorage.clear();
        initStorage();
        alert('✅ 所有資料已清除！');
        location.reload();
    }
}

// 初始化
initStorage();
