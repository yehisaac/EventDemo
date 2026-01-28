/**
 * 動態簽到碼系統模組
 * Event Management System v3.0.0
 */

// ==================== 生成簽到碼 ====================
function generateCheckinCode() {
    // 生成6位數字母數字組合 (排除易混淆字符: I, L, O, 0, 1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ==================== 更新簽到碼 ====================
function updateCheckinCode(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event || !event.checkinCodeEnabled) return;

    const newCode = generateCheckinCode();
    event.currentCheckinCode = {
        code: newCode,
        generatedAt: new Date().toISOString()
    };
    saveEvents(events);
    return newCode;
}

// ==================== 驗證簽到碼有效性 ====================
function isCheckinCodeValid(event) {
    if (!event.currentCheckinCode) return false;

    const generatedAt = new Date(event.currentCheckinCode.generatedAt);
    const now = new Date();
    const diffSeconds = (now - generatedAt) / 1000;

    // 簽到碼30秒有效
    return diffSeconds < 30;
}

// ==================== 驗證使用者輸入的簽到碼 ====================
function validateCheckinCode(eventId, inputCode) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event || !event.checkinCodeEnabled) return true; // 未啟用簽到碼，直接通過

    if (!event.currentCheckinCode) return false;
    if (!isCheckinCodeValid(event)) return false;

    return event.currentCheckinCode.code === inputCode.toUpperCase();
}
