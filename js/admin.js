/**
 * 管理者功能模組
 * Event Management System v3.0.0
 */

// ==================== 渲染管理者介面 ====================
function renderAdminScreen() {
    const events = getEvents();
    const registrations = getRegistrations();

    // 更新統計卡片
    document.getElementById('totalEvents').textContent = events.length;
    document.getElementById('totalRegistrations').textContent = registrations.length;
    document.getElementById('pendingApprovals').textContent = registrations.filter(r => r.status === 'pending').length;

    const container = document.getElementById('adminEventsList');
    container.innerHTML = '';

    events.forEach(event => {
        const regCount = registrations.filter(r => r.eventId === event.id).length;
        const approvedCount = registrations.filter(r =>
            r.eventId === event.id && (r.status === 'approved' || (event.type === 'OnSite' && r.status === 'pending'))
        ).length;
        const waitlistCount = registrations.filter(r =>
            r.eventId === event.id && r.status === 'waitlist'
        ).length;

        const card = document.createElement('div');
        card.className = 'card';

        let statusInfo = '';
        if (event.type === 'Task') {
            statusInfo = `<div class="card-content"><strong>目標：</strong>參與 ${event.taskGoal} 次活動<br><strong>獎勵：</strong>${event.taskPoints} 點</div>`;
            if (event.startTime && event.endTime) {
                statusInfo += `<div class="card-content" style="color: #718096; font-size: 13px;">📅 任務期間: ${new Date(event.startTime).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})} ~ ${new Date(event.endTime).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>`;
            }
        } else {
            statusInfo = `<div class="card-content"><strong>報名人數：</strong>${approvedCount}/${event.maxParticipants > 0 ? event.maxParticipants : '不限'}`;
            if (waitlistCount > 0) {
                statusInfo += ` <span style="color: #ed8936;">(候補 ${waitlistCount})</span>`;
            }
            statusInfo += `</div>`;

            if (event.type === 'Online' && event.drawSlots > 0) {
                statusInfo += `<div class="card-content"><strong>抽獎名額：</strong>${event.drawSlots} 名</div>`;
            }

            // 顯示簽到碼（僅限 OnSite 活動且啟用簽到碼）
            if (event.type === 'OnSite' && event.checkinCodeEnabled) {
                const hasValidCode = event.currentCheckinCode && isCheckinCodeValid(event);
                const codeDisplay = hasValidCode ? event.currentCheckinCode.code : '尚未生成';

                statusInfo += `
                    <div class="checkin-code-section">
                        <div class="checkin-code-header">
                            <strong>📱 動態簽到碼</strong>
                            <button class="btn-refresh-code" onclick="refreshCheckinCode('${event.id}')" title="手動更新簽到碼">
                                🔄 更新
                            </button>
                        </div>
                        <div class="checkin-code-display" id="checkinCode_${event.id}">
                            ${codeDisplay}
                        </div>
                        <div class="checkin-code-timer" id="timer_${event.id}">
                            ${hasValidCode ? '有效期限: 30 秒' : '點擊更新按鈕生成簽到碼'}
                        </div>
                        <div class="qr-code-container" id="qrcode_${event.id}"></div>
                    </div>
                `;

                // 延遲渲染 QR Code（等 DOM 元素建立後）
                setTimeout(() => {
                    const qrContainer = document.getElementById(`qrcode_${event.id}`);
                    if (qrContainer && hasValidCode) {
                        qrContainer.innerHTML = ''; // 清空舊的
                        new QRCode(qrContainer, {
                            text: event.currentCheckinCode.code,
                            width: 150,
                            height: 150,
                            colorDark: "#1a202c",
                            colorLight: "#ffffff"
                        });
                    }

                    // 啟動倒數計時器
                    if (hasValidCode) {
                        startCheckinTimer(event.id);
                    }
                }, 100);
            }
        }

        let actionButtons = `
            <button class="btn btn-secondary" onclick="editEvent('${event.id}')">編輯</button>
            <button class="btn btn-danger" onclick="deleteEvent('${event.id}')">刪除</button>
        `;

        if (event.type !== 'Task') {
            actionButtons += `<button class="btn btn-primary" onclick="viewRegistrations('${event.id}')">查看報名 (${regCount})</button>`;
        }

        if (event.type === 'Online' && event.drawSlots > 0) {
            // 只有在報名截止後才顯示抽獎按鈕
            const now = new Date();
            const registrationEnded = !event.registrationEndTime || now >= new Date(event.registrationEndTime);

            if (registrationEnded) {
                actionButtons += `<button class="btn btn-success" onclick="executeDraw('${event.id}')">執行抽獎</button>`;
            } else {
                actionButtons += `<button class="btn btn-secondary" disabled title="報名截止後可執行抽獎">⏰ 等待報名截止</button>`;
            }
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${event.title}</div>
                <span class="card-badge badge-${event.type.toLowerCase()}">${event.type}</span>
            </div>
            ${statusInfo}
            <div class="card-content">${event.description}</div>
            <div class="card-actions">${actionButtons}</div>
        `;

        container.appendChild(card);
    });
}

// ==================== 簽到碼計時器 ====================
function startCheckinTimer(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event || !event.currentCheckinCode) return;

    const timerElement = document.getElementById(`timer_${eventId}`);
    if (!timerElement) return;

    const updateTimer = () => {
        const generatedAt = new Date(event.currentCheckinCode.generatedAt);
        const now = new Date();
        const diffSeconds = Math.floor((now - generatedAt) / 1000);
        const remaining = 30 - diffSeconds;

        if (remaining > 0) {
            timerElement.textContent = `有效期限: ${remaining} 秒`;
            timerElement.style.color = remaining <= 10 ? '#e53e3e' : '#718096';
        } else {
            timerElement.textContent = '簽到碼已過期，請更新';
            timerElement.style.color = '#e53e3e';
            return; // 停止計時器
        }

        setTimeout(updateTimer, 1000);
    };

    updateTimer();
}

// ==================== 手動更新簽到碼 ====================
function refreshCheckinCode(eventId) {
    const newCode = updateCheckinCode(eventId);
    if (newCode) {
        renderAdminScreen();
    }
}

// ==================== 顯示新增活動表單 ====================
function showAddEventModal() {
    document.getElementById('modalTitle').textContent = '新增活動';
    document.getElementById('eventForm').reset();
    document.getElementById('eventIdInput').value = Date.now().toString();
    document.getElementById('eventModal').classList.add('active');
    handleEventTypeChange(); // 初始化表單顯示
}

// ==================== 編輯活動 ====================
function editEvent(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('modalTitle').textContent = '編輯活動';
    document.getElementById('eventIdInput').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventType').value = event.type;

    if (event.type === 'Online') {
        document.getElementById('eventLink').value = event.link || '';
        document.getElementById('onlineRegistrationStartTime').value = event.registrationStartTime || '';
        document.getElementById('onlineRegistrationEndTime').value = event.registrationEndTime || '';
        document.getElementById('onlineMaxParticipants').value = event.maxParticipants || '';
        document.getElementById('drawSlots').value = event.drawSlots || '';
    } else if (event.type === 'OnSite') {
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('registrationStartTime').value = event.registrationStartTime || '';
        document.getElementById('registrationEndTime').value = event.registrationEndTime || '';
        document.getElementById('onsiteMaxParticipants').value = event.maxParticipants || '';
        document.getElementById('checkinStartTime').value = event.checkinStartTime || '';
        document.getElementById('checkinEndTime').value = event.checkinEndTime || '';
        document.getElementById('checkinCodeEnabled').checked = event.checkinCodeEnabled || false;
    } else if (event.type === 'Task') {
        document.getElementById('taskGoal').value = event.taskGoal || '';
        document.getElementById('taskPoints').value = event.taskPoints || '';
        document.getElementById('taskStartTime').value = event.startTime || '';
        document.getElementById('taskEndTime').value = event.endTime || '';
    }

    handleEventTypeChange();
    document.getElementById('eventModal').classList.add('active');
}

// ==================== 刪除活動 ====================
function deleteEvent(eventId) {
    if (!confirm('確定要刪除此活動嗎？此操作無法復原！')) return;

    const events = getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index > -1) {
        events.splice(index, 1);
        saveEvents(events);

        // 刪除相關報名
        const registrations = getRegistrations();
        const filtered = registrations.filter(r => r.eventId !== eventId);
        saveRegistrations(filtered);

        renderAdminScreen();
    }
}

// ==================== 動態表單切換 ====================
function handleEventTypeChange() {
    const type = document.getElementById('eventType').value;

    // 隱藏所有類型專屬欄位
    document.querySelectorAll('.online-field').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.onsite-field').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.task-field').forEach(el => el.classList.add('hidden'));

    // 顯示對應類型的欄位
    if (type === 'Online') {
        document.querySelectorAll('.online-field').forEach(el => el.classList.remove('hidden'));
    } else if (type === 'OnSite') {
        document.querySelectorAll('.onsite-field').forEach(el => el.classList.remove('hidden'));
    } else if (type === 'Task') {
        document.querySelectorAll('.task-field').forEach(el => el.classList.remove('hidden'));
    }
}

// ==================== 關閉模態框 ====================
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

// ==================== 儲存活動（表單提交） ====================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('eventForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const eventId = document.getElementById('eventIdInput').value;
            const type = document.getElementById('eventType').value;

            const event = {
                id: eventId,
                title: document.getElementById('eventTitle').value,
                description: document.getElementById('eventDescription').value,
                type: type
            };

            if (type === 'Online') {
                event.link = document.getElementById('eventLink').value;
                event.registrationStartTime = document.getElementById('onlineRegistrationStartTime').value;
                event.registrationEndTime = document.getElementById('onlineRegistrationEndTime').value;
                event.maxParticipants = parseInt(document.getElementById('onlineMaxParticipants').value) || 0;
                event.drawSlots = parseInt(document.getElementById('drawSlots').value) || 0;
            } else if (type === 'OnSite') {
                event.location = document.getElementById('eventLocation').value;
                event.registrationStartTime = document.getElementById('registrationStartTime').value;
                event.registrationEndTime = document.getElementById('registrationEndTime').value;
                event.maxParticipants = parseInt(document.getElementById('onsiteMaxParticipants').value) || 0;
                event.checkinStartTime = document.getElementById('checkinStartTime').value;
                event.checkinEndTime = document.getElementById('checkinEndTime').value;
                event.checkinCodeEnabled = document.getElementById('checkinCodeEnabled').checked;
            } else if (type === 'Task') {
                event.taskGoal = parseInt(document.getElementById('taskGoal').value) || 0;
                event.taskPoints = parseInt(document.getElementById('taskPoints').value) || 0;
                event.startTime = document.getElementById('taskStartTime').value;
                event.endTime = document.getElementById('taskEndTime').value;
            }

            const events = getEvents();
            const index = events.findIndex(e => e.id === eventId);

            if (index > -1) {
                // 編輯現有活動（保留舊的簽到碼資料）
                event.currentCheckinCode = events[index].currentCheckinCode;
                event.lastDrawTime = events[index].lastDrawTime;
                events[index] = event;
            } else {
                // 新增活動
                events.push(event);
            }

            saveEvents(events);
            closeEventModal();
            renderAdminScreen();
        });
    }
});

// ==================== 查看報名明細 ====================
function viewRegistrations(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const registrations = getRegistrations().filter(r => r.eventId === eventId);

    let html = '';

    // 如果是 OnSite 活動且啟用了簽到碼，顯示簽到碼區域
    if (event.type === 'OnSite' && event.checkinCodeEnabled) {
        // 如果沒有簽到碼或已過期，生成新的
        if (!event.currentCheckinCode || !isCheckinCodeValid(event)) {
            updateCheckinCode(eventId);
            // 重新獲取更新後的活動
            const updatedEvents = getEvents();
            const updatedEvent = updatedEvents.find(e => e.id === eventId);
            Object.assign(event, updatedEvent);
        }

        const code = event.currentCheckinCode.code;
        const generatedAt = new Date(event.currentCheckinCode.generatedAt);
        const now = new Date();
        const remainingSeconds = Math.max(0, 30 - Math.floor((now - generatedAt) / 1000));

        html += `
            <div class="admin-table" style="margin-bottom: 20px; text-align: center;">
                <h3 style="color: #667eea; margin-bottom: 15px;">🔐 動態簽到碼</h3>
                <div id="checkinCodeDisplay" style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0;">
                    ${code}
                </div>
                <div id="countdown" style="font-size: 18px; color: #ed8936; margin: 10px 0;">
                    剩餘時間: <span id="remainingTime">${remainingSeconds}</span> 秒
                </div>
                <div id="qrcode" style="margin: 20px auto; display: flex; justify-content: center;"></div>
                <p style="color: #718096; font-size: 14px;">簽到碼每 30 秒自動刷新</p>
            </div>
        `;
    }

    html += '<div class="admin-table"><table><thead><tr>';
    html += '<th>使用者 ID</th>';
    html += '<th>報名時間</th>';
    html += '<th>狀態</th>';
    if (event.type === 'OnSite') {
        html += '<th>核准時間</th>';
        html += '<th>簽到狀態</th>';
        html += '<th>簽到時間</th>';
    }
    html += '<th>中獎</th>';
    html += '<th>操作</th>';
    html += '</tr></thead><tbody>';

    registrations.forEach(reg => {
        html += '<tr>';
        html += `<td>${reg.userName}</td>`;
        html += `<td>${new Date(reg.timestamp).toLocaleString('zh-TW')}</td>`;

        // 狀態顯示
        let statusText = '';
        let statusInfo = '';
        if (reg.status === 'pending') {
            statusText = '待審核';
        } else if (reg.status === 'approved') {
            statusText = '已核准';
        } else if (reg.status === 'rejected') {
            statusText = '已拒絕';
        } else if (reg.status === 'waitlist') {
            statusText = `候補 #${reg.waitlistPosition || '?'}`;
            statusInfo = reg.waitlistTime ? `<br><small>候補時間: ${new Date(reg.waitlistTime).toLocaleString('zh-TW')}</small>` : '';
        }

        html += `<td><span class="status-badge status-${reg.status}">${statusText}</span>${statusInfo}</td>`;

        if (event.type === 'OnSite') {
            html += `<td>${reg.approvedTime ? new Date(reg.approvedTime).toLocaleString('zh-TW') : '-'}</td>`;
            html += `<td>${reg.checkedIn ? '✅ 已簽到' : '⏳ 未簽到'}</td>`;
            html += `<td>${reg.checkedInTime ? new Date(reg.checkedInTime).toLocaleString('zh-TW') : '-'}</td>`;
        }

        html += `<td>${reg.isWinner ? '🎉 中獎' : '-'}</td>`;
        html += `<td>`;

        if (reg.status === 'pending') {
            html += `<button class="btn btn-success" onclick="approveRegistration('${eventId}', '${reg.userName}')">核准</button> `;
            html += `<button class="btn btn-danger" onclick="rejectRegistration('${eventId}', '${reg.userName}')">拒絕</button>`;
        } else if (reg.status === 'waitlist') {
            html += `<button class="btn btn-primary" onclick="promoteWaitlistUser('${eventId}', '${reg.userName}')">手動遞補</button>`;
        }

        html += `</td></tr>`;
    });

    html += '</tbody></table></div>';

    document.getElementById('registrationsContent').innerHTML = html;
    document.getElementById('registrationsModal').classList.add('active');

    // 如果啟用了簽到碼，啟動倒數計時和 QR Code 生成
    if (event.type === 'OnSite' && event.checkinCodeEnabled) {
        // 生成 QR Code
        const qrcodeElement = document.getElementById('qrcode');
        if (qrcodeElement && typeof QRCode !== 'undefined') {
            qrcodeElement.innerHTML = ''; // 清空舊的 QR Code
            new QRCode(qrcodeElement, {
                text: event.currentCheckinCode.code,
                width: 200,
                height: 200,
                colorDark: "#667eea",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        // 啟動倒數計時
        if (window.checkinCodeTimer) {
            clearInterval(window.checkinCodeTimer);
        }

        window.checkinCodeTimer = setInterval(() => {
            const generatedAt = new Date(event.currentCheckinCode.generatedAt);
            const now = new Date();
            const remainingSeconds = Math.max(0, 30 - Math.floor((now - generatedAt) / 1000));

            const remainingTimeElement = document.getElementById('remainingTime');
            if (remainingTimeElement) {
                remainingTimeElement.textContent = remainingSeconds;
            }

            // 時間到了，重新生成簽到碼
            if (remainingSeconds <= 0) {
                updateCheckinCode(eventId);
                viewRegistrations(eventId);
            }
        }, 1000);
    }
}

// ==================== 關閉報名明細 ====================
function closeRegistrationsModal() {
    // 停止倒數計時器
    if (window.checkinCodeTimer) {
        clearInterval(window.checkinCodeTimer);
        window.checkinCodeTimer = null;
    }
    document.getElementById('registrationsModal').classList.remove('active');
}

// ==================== 核准報名 ====================
function approveRegistration(eventId, userName) {
    const registrations = getRegistrations();
    const reg = registrations.find(r => r.eventId === eventId && r.userName === userName);
    if (!reg) return;

    reg.status = 'approved';
    reg.approvedTime = new Date().toISOString();
    saveRegistrations(registrations);

    alert('已核准報名');
    viewRegistrations(eventId);
}

// ==================== 拒絕報名 ====================
function rejectRegistration(eventId, userName) {
    const registrations = getRegistrations();
    const reg = registrations.find(r => r.eventId === eventId && r.userName === userName);
    if (!reg) return;

    reg.status = 'rejected';
    saveRegistrations(registrations);

    // 拒絕報名後，嘗試自動遞補候補名單
    promoteFromWaitlist(eventId);

    alert('已拒絕報名');
    viewRegistrations(eventId);
}

// ==================== 執行抽獎 ====================
function executeDraw(eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event || event.type !== 'Online') return;

    // 檢查報名截止時間
    if (event.registrationEndTime) {
        const now = new Date();
        const endTime = new Date(event.registrationEndTime);
        if (now < endTime) {
            alert(`報名尚未截止！\n截止時間：${endTime.toLocaleString('zh-TW')}\n\n抽獎必須在報名截止後執行。`);
            return;
        }
    }

    const registrations = getRegistrations();
    const eligibleRegs = registrations.filter(r =>
        r.eventId === eventId && r.status === 'approved' && !r.isWinner
    );

    if (eligibleRegs.length === 0) {
        alert('沒有符合抽獎資格的報名者！');
        return;
    }

    const winnerCount = Math.min(event.drawSlots, eligibleRegs.length);
    if (!confirm(`將抽出 ${winnerCount} 位中獎者，確定執行？`)) return;

    // 隨機抽選
    const shuffled = eligibleRegs.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, winnerCount);

    winners.forEach(winner => {
        winner.isWinner = true;
    });

    // 記錄抽獎執行時間
    event.lastDrawTime = new Date().toISOString();
    saveEvents(events);
    saveRegistrations(registrations);

    alert(`抽獎完成！共 ${winnerCount} 位中獎者`);
    renderAdminScreen();
}
