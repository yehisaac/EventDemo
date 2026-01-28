/**
 * 任務系統模組
 * Event Management System v3.0.0
 */

// ==================== 計算使用者任務進度 ====================
function calculateUserTaskProgress(userId, taskEvent) {
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
        } else if (event.type === 'OnSite' && reg.status === 'approved' && reg.checkedIn) {
            activityTime = new Date(reg.checkedInTime || reg.timestamp).getTime();
        }

        if (activityTime && activityTime >= taskStart && activityTime <= taskEnd) {
            count++;
        }
    });

    return count;
}

// ==================== 領取任務獎勵 ====================
function claimTaskReward(taskId, points) {
    const claims = getTaskClaims(currentUser);

    if (claims[taskId]) {
        alert('您已經領取過此任務獎勵！');
        return;
    }

    const currentPoints = getUserPoints(currentUser);
    saveUserPoints(currentUser, currentPoints + points);
    saveTaskClaim(currentUser, taskId);

    alert(`🎉 恭喜！您獲得了 ${points} 點獎勵！`);
    renderUserScreen();
}
