/**
 * 使用者功能模組
 * Event Management System v3.0.0
 */

// ==================== 渲染使用者介面 ====================
function renderUserScreen() {
    const events = getEvents();
    const registrations = getRegistrations();

    // 更新點數顯示
    const userPoints = getUserPoints(currentUser);
    document.getElementById('userPoints').textContent = userPoints;

    // 任務進度 Banner - 只顯示未過期的任務
    const taskEvent = events.find(e => e.type === 'Task');
    const taskBanner = document.getElementById('taskBanner');

    if (taskEvent) {
        const now = new Date();
        const taskEnd = taskEvent.endTime ? new Date(taskEvent.endTime) : null;
        const isTaskExpired = taskEnd && now > taskEnd;

        // 如果任務已過期，不顯示 Banner
        if (isTaskExpired) {
            taskBanner.classList.add('hidden');
        } else {
            const userProgress = calculateUserTaskProgress(currentUser, taskEvent);
            const percentage = Math.min(100, (userProgress / taskEvent.taskGoal) * 100);
            const isCompleted = userProgress >= taskEvent.taskGoal;
            const claims = getTaskClaims(currentUser);
            const hasClaimed = claims[taskEvent.id];

            const taskStart = taskEvent.startTime ? new Date(taskEvent.startTime) : null;
            const isTaskActive = (!taskStart || now >= taskStart) && (!taskEnd || now <= taskEnd);

            let timeInfo = '';
            if (taskStart && taskEnd) {
                timeInfo = `<p style="font-size: 14px;">📅 任務期間: ${taskStart.toLocaleDateString('zh-TW')} ~ ${taskEnd.toLocaleDateString('zh-TW')}</p>`;
            }

            taskBanner.classList.remove('hidden');
            taskBanner.innerHTML = `
                <h3>🎯 ${taskEvent.title}</h3>
                <p>${taskEvent.description}</p>
                ${timeInfo}
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%">
                        ${userProgress} / ${taskEvent.taskGoal}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <span>目前進度: ${userProgress} 次參與</span>
                    <span>獎勵: ${taskEvent.taskPoints} 點</span>
                </div>
                ${isCompleted ? `
                    <div style="margin-top: 15px;">
                        <div class="achievement-stamp">🏆 任務達成！</div>
                        ${!hasClaimed ? `
                            <button class="btn btn-claim" onclick="claimTaskReward('${taskEvent.id}', ${taskEvent.taskPoints})" style="margin-top: 10px;">
                                🎁 領取 ${taskEvent.taskPoints} 點獎勵
                            </button>
                        ` : '<p style="color: #ffd700; margin-top: 10px;">✅ 獎勵已領取</p>'}
                    </div>
                ` : ''}
                ${!isTaskActive ? '<p style="color: #ffd700; margin-top: 10px;">⏰ 任務尚未開始</p>' : ''}
            `;
        }
    } else {
        taskBanner.classList.add('hidden');
    }

    // 活動列表 - 分為進行中和歷史
    const container = document.getElementById('userEventsList');
    const historyContainer = document.getElementById('historyEventsList');
    const historySection = document.getElementById('historySection');
    container.innerHTML = '';
    historyContainer.innerHTML = '';

    const userEvents = events.filter(e => e.type !== 'Task');
    const activeEvents = userEvents.filter(e => !isEventExpired(e));
    const expiredEvents = userEvents.filter(e => isEventExpired(e));

    // 按照創建時間降序排列（ID 越大表示創建時間越晚）
    activeEvents.sort((a, b) => b.id.localeCompare(a.id));
    expiredEvents.sort((a, b) => b.id.localeCompare(a.id));

    // 渲染進行中的活動
    activeEvents.forEach(event => {
        const userReg = registrations.find(r =>
            r.eventId === event.id && r.userName === currentUser
        );

        const card = document.createElement('div');
        card.className = 'card';

        let statusInfo = '';
        let actionButtons = '';

        if (userReg) {
            if (userReg.isWinner) {
                statusInfo = '<div class="winner-badge">🎉 您已中獎！</div>';
            }

            if (userReg.status === 'pending') {
                statusInfo += '<div class="info-text">⏳ 等待審核中...</div>';
                if (event.type === 'OnSite') {
                    actionButtons = `<button class="btn btn-danger" onclick="cancelRegistration('${event.id}')">取消報名</button>`;
                }
            } else if (userReg.status === 'approved') {
                statusInfo += '<div class="info-text">✅ 報名已核准</div>';
                if (userReg.approvedTime) {
                    statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px;">核准時間: ${new Date(userReg.approvedTime).toLocaleString('zh-TW')}</div>`;
                }

                // 顯示 Hybrid 參與模式
                if (event.type === 'OnSite' && event.allowOnlineView && userReg.participationMode) {
                    const modeIcon = userReg.participationMode === 'online' ? '🌐' : '📍';
                    const modeText = userReg.participationMode === 'online' ? '線上參與' : '實體參與';
                    statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px; color: #667eea;">${modeIcon} ${modeText}</div>`;
                }

                // 簽到按鈕邏輯：線上參與者免簽到
                if (event.type === 'OnSite') {
                    const isOnlineParticipant = event.allowOnlineView && userReg.participationMode === 'online';

                    if (isOnlineParticipant) {
                        statusInfo += '<div class="info-text" style="background: #e6fffa; border-left-color: #38b2ac;">🌐 線上參與，無需簽到</div>';
                        if (event.onlineLink) {
                            statusInfo += `<div class="card-content" style="margin: 5px 0;"><a href="${event.onlineLink}" target="_blank" class="btn btn-secondary" style="display: inline-block; padding: 5px 10px; font-size: 12px;">🔗 前往線上活動</a></div>`;
                        }
                    } else if (!userReg.checkedIn) {
                        actionButtons = `<button class="btn btn-success" onclick="checkIn('${event.id}')">📍 簽到</button>`;
                    } else {
                        statusInfo += '<div class="info-text">✅ 已完成簽到</div>';
                        if (userReg.checkedInTime) {
                            statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px;">簽到時間: ${new Date(userReg.checkedInTime).toLocaleString('zh-TW')}</div>`;
                        }
                    }
                }
            } else if (userReg.status === 'waitlist') {
                statusInfo += '<div class="info-text" style="color: #ed8936;">📝 候補名單中</div>';
                if (userReg.waitlistPosition) {
                    statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px; color: #ed8936;">候補順位: 第 ${userReg.waitlistPosition} 位</div>`;
                }
                if (userReg.waitlistTime) {
                    statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px;">加入候補時間: ${new Date(userReg.waitlistTime).toLocaleString('zh-TW')}</div>`;
                }
                actionButtons = `<button class="btn btn-secondary" onclick="cancelWaitlist('${event.id}')">取消候補</button>`;
            } else if (userReg.status === 'rejected') {
                statusInfo += '<div class="warning-text">❌ 報名未通過</div>';
            }
        } else {
            actionButtons = `<button class="btn btn-primary" onclick="registerEvent('${event.id}')">報名參加</button>`;
        }

        actionButtons += ` <button class="btn btn-secondary" onclick="viewEventDetail('${event.id}')">查看詳情</button>`;

        // 活動時間資訊
        let timeInfo = '';
        if (event.registrationStartTime && event.registrationEndTime) {
            timeInfo = `<div class="card-content" style="color: #718096; font-size: 13px; margin-top: 10px;">
                📅 報名期間: ${new Date(event.registrationStartTime).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})} ~ ${new Date(event.registrationEndTime).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
            </div>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${event.title}</div>
                <span class="card-badge badge-${event.type.toLowerCase()}">${event.type}</span>
            </div>
            ${statusInfo}
            <div class="card-content">${event.description}</div>
            ${timeInfo}
            <div class="card-actions">${actionButtons}</div>
        `;

        container.appendChild(card);
    });

    // 渲染歷史活動
    if (expiredEvents.length > 0) {
        historySection.classList.remove('hidden');

        expiredEvents.forEach(event => {
            const userReg = registrations.find(r =>
                r.eventId === event.id && r.userName === currentUser
            );

            const card = document.createElement('div');
            card.className = 'card card-expired'; // 歷史活動使用已結束樣式

            let statusInfo = '<div class="warning-text">📅 活動已結束</div>';
            let actionButtons = '';

            if (userReg) {
                // 中獎與未中獎提示（Online 活動專用）
                if (event.type === 'Online' && event.lastDrawTime) {
                    if (userReg.isWinner) {
                        statusInfo += '<div class="winner-badge">🎉 您已中獎！</div>';
                    } else if (userReg.status === 'approved') {
                        statusInfo += '<div class="info-text" style="background: #fff3cd; border-left-color: #ffc107; color: #856404;">💔 未中獎</div>';
                    }
                } else if (userReg.isWinner) {
                    statusInfo += '<div class="winner-badge">🎉 您已中獎！</div>';
                }

                if (userReg.status === 'approved') {
                    statusInfo += '<div class="info-text">✅ 已參與此活動</div>';
                    if (userReg.approvedTime) {
                        statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px;">核准時間: ${new Date(userReg.approvedTime).toLocaleString('zh-TW')}</div>`;
                    }
                    if (event.type === 'OnSite' && userReg.checkedIn && userReg.checkedInTime) {
                        statusInfo += `<div class="card-content" style="margin: 5px 0; font-size: 12px;">簽到時間: ${new Date(userReg.checkedInTime).toLocaleString('zh-TW')}</div>`;
                    }
                } else if (userReg.status === 'rejected') {
                    statusInfo += '<div class="warning-text">❌ 報名未通過</div>';
                } else if (userReg.status === 'pending') {
                    statusInfo += '<div class="warning-text">⏳ 審核未完成</div>';
                }
            }

            actionButtons = `<button class="btn btn-secondary" onclick="viewEventDetail('${event.id}')">查看詳情</button>`;

            // 活動時間資訊
            let historyTimeInfo = '';
            if (event.registrationStartTime && event.registrationEndTime) {
                historyTimeInfo = `<div class="card-content" style="color: #718096; font-size: 13px; margin-top: 10px;">
                    📅 報名期間: ${new Date(event.registrationStartTime).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})} ~ ${new Date(event.registrationEndTime).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                </div>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">
                        ${event.title}
                        <span class="expired-badge">已結束</span>
                    </div>
                    <span class="card-badge badge-${event.type.toLowerCase()}">${event.type}</span>
                </div>
                ${statusInfo}
                <div class="card-content">${event.description}</div>
                ${historyTimeInfo}
                <div class="card-actions">${actionButtons}</div>
            `;

            historyContainer.appendChild(card);
        });
    } else {
        historySection.classList.add('hidden');
    }
}

// ==================== 報名活動 ====================
function registerEvent(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const registrations = getRegistrations();

    // 檢查是否已報名
    const existing = registrations.find(r =>
        r.eventId === eventId && r.userName === currentUser
    );

    if (existing) {
        alert('您已經報名過此活動！');
        return;
    }

    const now = new Date();

    // Online 活動檢查報名時間
    if (event.type === 'Online') {
        if (event.registrationStartTime && now < new Date(event.registrationStartTime)) {
            alert(`報名尚未開始！\n開始時間：${new Date(event.registrationStartTime).toLocaleString('zh-TW')}`);
            return;
        }
        if (event.registrationEndTime && now > new Date(event.registrationEndTime)) {
            alert(`報名已截止！\n截止時間：${new Date(event.registrationEndTime).toLocaleString('zh-TW')}`);
            return;
        }
    }

    // OnSite 活動檢查報名時間
    if (event.type === 'OnSite') {
        if (event.registrationStartTime && now < new Date(event.registrationStartTime)) {
            alert(`報名尚未開始！\n開始時間：${new Date(event.registrationStartTime).toLocaleString('zh-TW')}`);
            return;
        }
        if (event.registrationEndTime && now > new Date(event.registrationEndTime)) {
            alert(`報名已截止！\n截止時間：${new Date(event.registrationEndTime).toLocaleString('zh-TW')}`);
            return;
        }
    }

    // Hybrid 混合模式：詢問參與方式
    let participationMode = null;
    if (event.type === 'OnSite' && event.allowOnlineView) {
        const choice = prompt(
            '此活動支援 Hybrid 混合模式（線上＋實體）\n\n' +
            '請選擇您的參與方式：\n' +
            '1 = 實體參與（需現場簽到）\n' +
            '2 = 線上參與（免簽到，提供線上連結）\n\n' +
            '請輸入 1 或 2：'
        );

        if (choice === '1') {
            participationMode = 'onsite';
        } else if (choice === '2') {
            participationMode = 'online';
        } else {
            alert('請輸入 1 或 2 選擇參與方式！');
            return;
        }
    }

    // 檢查報名人數上限
    let isWaitlist = false;
    if (event.maxParticipants > 0) {
        const approvedCount = getApprovedCount(eventId);

        if (approvedCount >= event.maxParticipants) {
            if (event.type === 'Online') {
                // Online 活動達到上限，無法報名
                alert(`報名人數已達上限（${event.maxParticipants}人）！`);
                return;
            } else if (event.type === 'OnSite') {
                // OnSite 活動達到上限，進入候補名單
                isWaitlist = true;
            }
        }
    }

    const registration = {
        eventId: eventId,
        userName: currentUser,
        timestamp: new Date().toISOString(),
        status: isWaitlist ? 'waitlist' : (event.type === 'Online' ? 'approved' : 'pending'),
        checkedIn: false,
        isWinner: false,
        approvedTime: (event.type === 'Online' && !isWaitlist) ? new Date().toISOString() : null
    };

    // 記錄 Hybrid 參與模式
    if (participationMode) {
        registration.participationMode = participationMode;
    }

    // 如果是候補，記錄候補時間和順位
    if (isWaitlist) {
        registration.waitlistTime = new Date().toISOString();
        const waitlistCount = registrations.filter(r =>
            r.eventId === eventId && r.status === 'waitlist'
        ).length;
        registration.waitlistPosition = waitlistCount + 1;
    }

    registrations.push(registration);
    saveRegistrations(registrations);

    if (isWaitlist) {
        alert(`報名人數已達上限！您已進入候補名單（候補順位：${registration.waitlistPosition}）`);
    } else if (event.type === 'Online') {
        alert('報名成功！');
    } else {
        if (participationMode === 'online') {
            alert('報名成功！等待管理者審核\n\n您選擇了線上參與，核准後無需簽到。');
        } else {
            alert('報名成功！等待管理者審核');
        }
    }

    renderUserScreen();
}

// ==================== 取消報名 ====================
function cancelRegistration(eventId) {
    const registrations = getRegistrations();
    const regIndex = registrations.findIndex(r =>
        r.eventId === eventId && r.userName === currentUser
    );

    if (regIndex === -1) return;

    const reg = registrations[regIndex];

    if (reg.status === 'approved') {
        alert('報名已核准，無法取消！');
        return;
    }

    if (confirm('確定要取消報名嗎？')) {
        // 檢查是否為 pending 狀態（佔用名額）
        const wasOccupyingSlot = (reg.status === 'pending');

        registrations.splice(regIndex, 1);
        saveRegistrations(registrations);

        // 如果有釋放名額，嘗試自動遞補
        if (wasOccupyingSlot) {
            promoteFromWaitlist(eventId);
        }

        alert('已取消報名');
        renderUserScreen();
    }
}

// ==================== 簽到 ====================
function checkIn(eventId, inputCode = null) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const registrations = getRegistrations();
    const reg = registrations.find(r =>
        r.eventId === eventId && r.userName === currentUser
    );

    if (!reg) return;

    if (reg.status !== 'approved') {
        alert('報名尚未核准，無法簽到！');
        return;
    }

    // Hybrid 模式：線上參與者無需簽到
    if (event.allowOnlineView && reg.participationMode === 'online') {
        alert('您選擇了線上參與，無需簽到！');
        return;
    }

    // 檢查簽到時間
    const now = new Date();
    if (event.checkinStartTime && now < new Date(event.checkinStartTime)) {
        alert(`簽到尚未開始！\n開始時間：${new Date(event.checkinStartTime).toLocaleString('zh-TW')}`);
        return;
    }
    if (event.checkinEndTime && now > new Date(event.checkinEndTime)) {
        alert(`簽到已截止！\n截止時間：${new Date(event.checkinEndTime).toLocaleString('zh-TW')}`);
        return;
    }

    // 如果啟用簽到碼，需要驗證
    if (event.checkinCodeEnabled) {
        if (!inputCode) {
            const code = prompt('請輸入簽到碼（6位字母數字）：');
            if (!code) return;
            inputCode = code;
        }

        if (!validateCheckinCode(eventId, inputCode)) {
            alert('簽到碼錯誤或已過期！請向活動管理者確認最新的簽到碼。');
            return;
        }
    }

    reg.checkedIn = true;
    reg.checkedInTime = new Date().toISOString();
    saveRegistrations(registrations);
    alert('簽到成功！');
    renderUserScreen();
}

// ==================== 查看活動詳情 ====================
function viewEventDetail(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const registrations = getRegistrations();
    const userReg = registrations.find(r =>
        r.eventId === eventId && r.userName === currentUser
    );

    document.getElementById('detailTitle').textContent = event.title;

    let html = `<div class="card-content">`;
    html += `<p><strong>類型：</strong><span class="card-badge badge-${event.type.toLowerCase()}">${event.type}</span></p>`;
    html += `<p><strong>說明：</strong>${event.description}</p>`;

    if (event.type === 'Online') {
        if (userReg && userReg.status === 'approved' && event.link) {
            html += `<p><strong>📍 連結：</strong><a href="${event.link}" target="_blank">${event.link}</a></p>`;
        } else if (!userReg || userReg.status !== 'approved') {
            html += `<p class="info-text">連結將在報名核准後顯示</p>`;
        }
        if (event.drawSlots > 0) {
            html += `<p><strong>🎁 抽獎名額：</strong>${event.drawSlots} 名</p>`;
            if (event.drawTime) {
                html += `<p><strong>⏰ 抽獎時間：</strong>${new Date(event.drawTime).toLocaleString('zh-TW')}</p>`;
            }
        }
    } else if (event.type === 'OnSite') {
        html += `<p><strong>📍 地點：</strong>${event.location || '未設定'}</p>`;

        // Hybrid 模式資訊
        if (event.allowOnlineView) {
            html += `<div class="info-text" style="background: #e6fffa; border-left-color: #38b2ac;">🌐 此活動支援 Hybrid 混合模式（線上＋實體）</div>`;
            if (userReg && userReg.status === 'approved' && userReg.participationMode === 'online' && event.onlineLink) {
                html += `<p><strong>🔗 線上連結：</strong><a href="${event.onlineLink}" target="_blank">${event.onlineLink}</a></p>`;
            }
        }

        if (event.registrationStartTime && event.registrationEndTime) {
            html += `<p><strong>📅 報名時間：</strong>${new Date(event.registrationStartTime).toLocaleString('zh-TW')} ~ ${new Date(event.registrationEndTime).toLocaleString('zh-TW')}</p>`;
        }
        if (event.checkinStartTime && event.checkinEndTime) {
            html += `<p><strong>⏰ 簽到時間：</strong>${new Date(event.checkinStartTime).toLocaleString('zh-TW')} ~ ${new Date(event.checkinEndTime).toLocaleString('zh-TW')}</p>`;
        }
    }

    // 顯示使用者的報名狀態
    if (userReg) {
        html += `<hr style="margin: 15px 0; border: none; border-top: 1px solid #e2e8f0;">`;
        html += `<p><strong>📋 您的報名狀態：</strong></p>`;
        html += `<p>報名時間: ${new Date(userReg.timestamp).toLocaleString('zh-TW')}</p>`;
        if (userReg.approvedTime) {
            html += `<p>核准時間: ${new Date(userReg.approvedTime).toLocaleString('zh-TW')}</p>`;
        }
        if (userReg.checkedInTime) {
            html += `<p>簽到時間: ${new Date(userReg.checkedInTime).toLocaleString('zh-TW')}</p>`;
        }
    }

    // 顯示中獎名單（遮罩處理）
    const winners = registrations.filter(r => r.eventId === eventId && r.isWinner);
    if (winners.length > 0) {
        html += `<div class="info-text">`;
        html += `<strong>🎉 中獎名單：</strong><br>`;
        winners.forEach(w => {
            const masked = maskUserId(w.userName);
            html += `${masked}<br>`;
        });
        html += `</div>`;
    }

    html += `</div>`;

    document.getElementById('eventDetailContent').innerHTML = html;
    document.getElementById('eventDetailModal').classList.add('active');
}

// ==================== 關閉活動詳情 ====================
function closeEventDetailModal() {
    document.getElementById('eventDetailModal').classList.remove('active');
}

// closeDetailModal 別名（向後兼容）
function closeDetailModal() {
    closeEventDetailModal();
}
