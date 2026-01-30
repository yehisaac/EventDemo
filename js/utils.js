/**
 * 工具函數模組
 * Event Management System v3.0.0
 */

// ==================== ID 遮罩處理 ====================
function maskUserId(userId) {
    if (userId.length <= 2) return userId;
    return userId[0] + '****' + userId[userId.length - 1];
}

// ==================== 活動過期判斷 ====================
function isEventExpired(event) {
    const now = new Date();

    if (event.type === 'Online') {
        // Online 活動：如果已執行抽獎則視為過期
        return event.lastDrawTime !== undefined && event.lastDrawTime !== '';
    } else if (event.type === 'OnSite') {
        // OnSite 活動：使用最晚的時間來判定過期
        const endTimes = [];

        if (event.endTime) {
            endTimes.push(new Date(event.endTime));
        }
        if (event.checkinEndTime) {
            endTimes.push(new Date(event.checkinEndTime));
        }
        if (event.registrationEndTime) {
            endTimes.push(new Date(event.registrationEndTime));
        }

        if (endTimes.length > 0) {
            // 使用最大（最晚）的時間作為活動結束判定
            const latestEndTime = new Date(Math.max(...endTimes));
            return now > latestEndTime;
        }
    }
    return false;
}

// ==================== 時間區間檢查 ====================
function isInTimeRange(timestamp, startTime, endTime) {
    const time = new Date(timestamp).getTime();
    const start = startTime ? new Date(startTime).getTime() : 0;
    const end = endTime ? new Date(endTime).getTime() : Infinity;
    return time >= start && time <= end;
}
