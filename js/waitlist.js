/**
 * 候補名單管理模組
 * Event Management System v3.0.0
 */

// ==================== 計算已核准人數 ====================
function getApprovedCount(eventId) {
    const registrations = getRegistrations();
    return registrations.filter(r =>
        r.eventId === eventId &&
        (r.status === 'approved' || r.status === 'pending')
    ).length;
}

// ==================== 自動遞補候補名單第一位 ====================
function promoteFromWaitlist(eventId) {
    const registrations = getRegistrations();
    const waitlisted = registrations
        .filter(r => r.eventId === eventId && r.status === 'waitlist')
        .sort((a, b) => new Date(a.waitlistTime) - new Date(b.waitlistTime));

    if (waitlisted.length > 0) {
        const firstWaitlisted = waitlisted[0];
        const events = getEvents();
        const event = events.find(e => e.id === eventId);

        if (event.type === 'Online') {
            firstWaitlisted.status = 'approved';
            firstWaitlisted.approvedTime = new Date().toISOString();
        } else {
            firstWaitlisted.status = 'pending';
        }

        delete firstWaitlisted.waitlistPosition;
        delete firstWaitlisted.waitlistTime;

        // 更新其他候補者順位
        waitlisted.slice(1).forEach((reg, index) => {
            reg.waitlistPosition = index + 1;
        });

        saveRegistrations(registrations);
        return true;
    }
    return false;
}

// ==================== 手動遞補候補者 ====================
function promoteWaitlistUser(eventId, userName) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
        alert('找不到該活動！');
        return;
    }

    const registrations = getRegistrations();
    const reg = registrations.find(r => r.eventId === eventId && r.userName === userName && r.status === 'waitlist');

    if (!reg) {
        alert('找不到該候補用戶！');
        return;
    }

    if (!confirm(`確定要將用戶 ${userName} 從候補名單提升為正式報名嗎？`)) return;

    const oldPosition = reg.waitlistPosition;

    // 變更狀態
    if (event.type === 'Online') {
        reg.status = 'approved';
        reg.approvedTime = new Date().toISOString();
    } else {
        reg.status = 'pending';
    }

    // 清除候補相關資訊
    delete reg.waitlistPosition;
    delete reg.waitlistTime;

    // 更新其他候補者的順位
    registrations
        .filter(r => r.eventId === eventId && r.status === 'waitlist' && r.waitlistPosition > oldPosition)
        .forEach(r => {
            r.waitlistPosition -= 1;
        });

    saveRegistrations(registrations);
    alert('已成功遞補！');
    viewRegistrations(eventId);
}

// ==================== 取消候補 ====================
function cancelWaitlist(eventId) {
    const registrations = getRegistrations();
    const regIndex = registrations.findIndex(r =>
        r.eventId === eventId && r.userName === currentUser && r.status === 'waitlist'
    );

    if (regIndex === -1) return;

    if (confirm('確定要取消候補嗎？')) {
        const canceledPosition = registrations[regIndex].waitlistPosition;
        registrations.splice(regIndex, 1);

        // 更新後續候補者的順位
        registrations
            .filter(r => r.eventId === eventId && r.status === 'waitlist' && r.waitlistPosition > canceledPosition)
            .forEach(r => {
                r.waitlistPosition -= 1;
            });

        saveRegistrations(registrations);
        alert('已取消候補');
        renderUserScreen();
    }
}
