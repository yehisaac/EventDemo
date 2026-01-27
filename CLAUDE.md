# 活動報名與任務累積系統 - Claude AI 開發指南

> 本文件專為 Claude AI 優化，提供結構化的開發指引

---

## 快速開始

這是一個單頁活動管理系統，整合報名、審核、簽到、抽獎和任務獎勵功能。

**一句話描述**：使用純前端技術（HTML+CSS+JS）實作的 OMO 活動報名系統，支援三種活動類型（Online/OnSite/Task），包含完整的時間控制、點數獎勵和資料隔離機制。

**核心概念**：
- **OMO (Online-Merge-Offline)**：線上線下融合的活動模式
- Online 活動：線上參與，提供連結資源（視訊、直播、文件等）
- OnSite 活動：實體現場參與，需簽到驗證
- 靈活組合實現混合式活動體驗

**核心技術**：
```
單一 HTML 檔案 + LocalStorage + Vanilla JavaScript
```

---

## 系統架構圖

```
┌─────────────────────────────────────────────┐
│           活動報名與任務累積系統              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐           ┌─────────┐         │
│  │ 管理者   │           │ 使用者   │         │
│  │ Admin   │           │  User   │         │
│  └────┬────┘           └────┬────┘         │
│       │                     │              │
│       ├─ 新增活動            ├─ 報名活動     │
│       ├─ 審核報名            ├─ 取消報名     │
│       ├─ 執行抽獎            ├─ 活動簽到     │
│       └─ 查看明細            ├─ 領取獎勵     │
│                             └─ 查看進度     │
│                                             │
├─────────────────────────────────────────────┤
│              LocalStorage 層                │
├─────────────────────────────────────────────┤
│  events          registrations              │
│  userPoints      taskClaims                 │
└─────────────────────────────────────────────┘
```

---

## 三種活動類型對比

| 特性 | Online | OnSite | Task |
|------|--------|--------|------|
| **報名方式** | 使用者主動 | 使用者主動 | 系統自動統計 |
| **審核流程** | 自動核准 | 管理者審核 | 不適用 |
| **時間控制** | 抽獎時間 | 報名+簽到時間 | 任務期間 |
| **特殊功能** | 抽獎 | 簽到+取消 | 點數獎勵 |
| **統計條件** | 已核准 | 已核准+已簽到 | 區間內累積 |
| **唯一性** | 多個 | 多個 | 僅一個 |

---

## 開發任務拆解

### 階段一：基礎架構（30%）

**任務 1.1：HTML 結構**
```html
- [ ] 登入畫面（管理者/使用者選擇）
- [ ] 管理者介面（統計卡片、活動列表）
- [ ] 使用者介面（點數顯示、任務 Banner、活動卡片）
- [ ] 三個 Modal（活動編輯、報名明細、活動詳情）
```

**任務 1.2：CSS 樣式系統**
```css
- [ ] 色彩變數定義（紫色漸層主題）
- [ ] 按鈕樣式（5種狀態 + 禁用）
- [ ] 卡片樣式（hover 效果）
- [ ] 進度條動畫
- [ ] Tooltip 提示
- [ ] 響應式 Grid 佈局
```

**任務 1.3：資料層**
```javascript
- [ ] initStorage() - 初始化四個 LocalStorage 項目
- [ ] getEvents() / saveEvents()
- [ ] getRegistrations() / saveRegistrations()
- [ ] getUserPoints() / saveUserPoints()
- [ ] getTaskClaims() / saveTaskClaim()
```

---

### 階段二：活動管理（25%）

**任務 2.1：活動 CRUD**
```javascript
- [ ] showAddEventModal() - 顯示新增表單
- [ ] handleEventTypeChange() - 動態欄位控制
  ├─ Online: 顯示 link, registrationStartTime, registrationEndTime, drawSlots
  ├─ OnSite: 顯示 location, 4個時間欄位
  └─ Task: 顯示 startTime, endTime, goal, points + 唯一性檢查
- [ ] eventForm.submit - 儲存活動（驗證 + 儲存）
- [ ] editEvent(id) - 載入資料到表單
- [ ] deleteEvent(id) - 刪除活動和相關報名
```

**任務 2.2：報名明細**
```javascript
- [ ] viewRegistrations(eventId) - 顯示報名列表
  ├─ 表格欄位：使用者、報名時間、狀態
  ├─ OnSite 額外欄位：核准時間、簽到狀態、簽到時間
  └─ 操作按鈕：核准/拒絕（僅 pending 狀態）
- [ ] approveRegistration() - 核准並記錄時間
- [ ] rejectRegistration() - 拒絕報名
```

**任務 2.3：抽獎功能**
```javascript
- [ ] executeDraw(eventId)
  ├─ 檢查：報名是否已結束（registrationEndTime）、是否已執行
  ├─ 篩選：status === "approved" && !isWinner
  ├─ 抽獎：隨機排序 + slice
  └─ 記錄：lastDrawTime
- [ ] 按鈕狀態控制（禁用 + hover 提示：報名尚未結束/已執行/可執行）
```

---

### 階段三：使用者功能（30%）

**任務 3.1：報名系統**
```javascript
- [ ] registerEvent(eventId)
  ├─ 檢查：是否已報名
  ├─ Online 檢查：報名時間區間（registrationStartTime ~ registrationEndTime）
  ├─ OnSite 檢查：報名時間區間（registrationStartTime ~ registrationEndTime）
  ├─ Online: status = "approved", 記錄 approvedTime
  └─ OnSite: status = "pending"
- [ ] cancelRegistration(eventId)
  ├─ 條件：status === "pending"
  └─ 動作：從陣列移除
```

**任務 3.2：簽到系統**
```javascript
- [ ] checkIn(eventId)
  ├─ 檢查：status === "approved"
  ├─ 檢查：簽到時間區間
  └─ 記錄：checkedIn = true, checkedInTime
```

**任務 3.3：活動詳情**
```javascript
- [ ] viewEventDetail(eventId)
  ├─ 顯示基本資訊
  ├─ Online: 連結（核准後）
  ├─ OnSite: 報名和簽到時間
  ├─ 中獎名單（遮罩處理）
  └─ 個人報名狀態和時間
```

**任務 3.4：歷史活動顯示**
```javascript
- [ ] isEventExpired(event) - 判斷活動是否過期
  ├─ Online: lastDrawTime 存在 → 已過期
  └─ OnSite: 簽到結束時間或報名結束時間已過 → 已過期
- [ ] renderUserScreen() 活動分類
  ├─ 分離進行中活動和歷史活動
  ├─ 進行中：正常顯示，可互動
  └─ 歷史活動：半透明顯示，只能查看詳情
```

---

### 階段四：任務系統（15%）

**任務 4.1：進度計算**
```javascript
- [ ] calculateUserTaskProgress(userId, taskEvent)
  ├─ 取得任務時間區間
  ├─ 過濾使用者的報名記錄
  ├─ Online: approved + approvedTime 在區間內 → +1
  └─ OnSite: approved + checkedIn + checkedInTime 在區間內 → +1
```

**任務 4.2：任務 UI**
```javascript
- [ ] renderUserScreen() 中的任務 Banner
  ├─ 檢查任務是否過期（endTime 已過）
  ├─ 過期任務：隱藏 Banner（不顯示）
  ├─ 未過期任務：
  │   ├─ 計算進度和百分比
  │   ├─ 顯示進度條
  │   ├─ 達成：顯示達成標誌 + 領取按鈕
  │   └─ 未開始：顯示提示
  └─ 不再顯示「任務已過期」標記
```

**任務 4.3：獎勵領取**
```javascript
- [ ] claimTaskReward(taskId, points)
  ├─ 檢查：是否已領取
  ├─ 增加點數
  ├─ 記錄領取狀態
  └─ 刷新介面
```

---

## 關鍵演算法

### 1. 活動過期判斷
```javascript
function isEventExpired(event) {
  const now = new Date();

  if (event.type === 'Online') {
    // Online 活動：如果已執行抽獎則視為過期
    return event.lastDrawTime !== undefined && event.lastDrawTime !== '';
  } else if (event.type === 'OnSite') {
    // OnSite 活動：簽到結束時間已過
    if (event.checkinEndTime) {
      return now > new Date(event.checkinEndTime);
    }
    // 如果沒有簽到時間，檢查報名結束時間
    if (event.registrationEndTime) {
      return now > new Date(event.registrationEndTime);
    }
  }
  return false;
}
// 用途：分離進行中活動和歷史活動
```

### 2. 時間區間檢查
```javascript
function isInTimeRange(timestamp, startTime, endTime) {
  const time = new Date(timestamp).getTime();
  const start = startTime ? new Date(startTime).getTime() : 0;
  const end = endTime ? new Date(endTime).getTime() : Infinity;
  return time >= start && time <= end;
}
```

### 2. 任務進度計算
```javascript
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
```

### 3. ID 遮罩
```javascript
function maskUserId(userId) {
  if (userId.length <= 2) return userId;
  return userId[0] + '****' + userId[userId.length - 1];
}
// "user12345" → "u****5"
```

### 4. 隨機抽獎
```javascript
function executeDraw(eventId) {
  // ... 檢查邏輯

  const eligibleRegs = registrations.filter(r =>
    r.eventId === eventId &&
    r.status === 'approved' &&
    !r.isWinner
  );

  const shuffled = eligibleRegs.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, event.drawSlots);

  winners.forEach(w => w.isWinner = true);
}
```

---

## 狀態機圖

### OnSite 活動報名狀態流轉
```
[未報名]
   ↓ registerEvent()
[pending] ←─────────────┐
   ├─→ 可取消報名         │
   ↓ approveRegistration() │
[approved] ───────────────┘ 不可取消
   ↓ checkIn()
[approved + checkedIn]
```

### Task 獎勵領取流程
```
[進度未達成]
   ↓ 參與活動
[進度累積中]
   ↓ 達成目標
[任務達成]
   ├─→ 期間內：顯示領取按鈕
   └─→ 已過期：無法領取
   ↓ claimTaskReward()
[已領取] → 不可重複領取
```

---

## 資料關聯圖

```
Event (活動)
  ↓ 1:N
Registration (報名)
  ↓ N:1
User (使用者)
  ↓ 1:1
UserPoints (點數)
  ↓ 1:N
TaskClaims (領取記錄)
```

**關聯邏輯**：
- 一個活動可以有多筆報名
- 一個使用者可以報名多個活動
- 一個使用者有一個點數帳戶
- 一個使用者可以領取多個任務獎勵

---

## 重要驗證規則

### 時間相關驗證

**報名時間檢查（OnSite）**：
```javascript
const now = new Date();
if (event.registrationStartTime && now < new Date(event.registrationStartTime)) {
  alert('報名尚未開始');
  return;
}
if (event.registrationEndTime && now > new Date(event.registrationEndTime)) {
  alert('報名已截止');
  return;
}
```

**簽到時間檢查（OnSite）**：
```javascript
if (event.checkinStartTime && now < new Date(event.checkinStartTime)) {
  alert('簽到尚未開始');
  return;
}
if (event.checkinEndTime && now > new Date(event.checkinEndTime)) {
  alert('簽到已截止');
  return;
}
```

**抽獎時間檢查（Online）**：
```javascript
if (event.drawTime && new Date() < new Date(event.drawTime)) {
  alert('抽獎時間尚未到期');
  return;
}
if (event.lastDrawTime) {
  alert('此活動已執行過抽獎');
  return;
}
```

### 唯一性驗證

**Task 唯一性**：
```javascript
if (type === 'Task' && !editingId) {
  const existingTask = events.find(e => e.type === 'Task');
  if (existingTask) {
    alert('系統已存在一個任務累積活動');
    return;
  }
}
```

**重複報名檢查**：
```javascript
const existing = registrations.find(r =>
  r.eventId === eventId && r.userName === currentUser
);
if (existing) {
  alert('您已經報名過此活動');
  return;
}
```

**重複領取檢查**：
```javascript
const claims = getTaskClaims(currentUser);
if (claims[taskId]) {
  alert('您已經領取過此任務的獎勵');
  return;
}
```

---

## UI 元件規格

### 按鈕狀態表

| 按鈕類別 | 背景色 | 使用場景 |
|---------|--------|---------|
| `.btn-primary` | #667eea | 主要操作（報名、儲存） |
| `.btn-success` | #48bb78 | 成功操作（核准、簽到） |
| `.btn-danger` | #f56565 | 危險操作（刪除、拒絕、取消） |
| `.btn-warning` | #ed8936 | 警告操作（執行抽獎） |
| `.btn-secondary` | #a0aec0 | 次要操作（查看、登出） |
| `.btn-claim` | #ffd700 漸層 | 領取獎勵 |
| `.btn:disabled` | #cbd5e0 | 禁用狀態 |

### 狀態標籤

| 標籤類別 | 背景色 | 文字色 | 含義 |
|---------|--------|--------|------|
| `.status-pending` | #fef3c7 | #92400e | 待審核 |
| `.status-approved` | #d1fae5 | #065f46 | 已核准 |
| `.status-rejected` | #fee2e2 | #991b1b | 已拒絕 |
| `.badge-online` | #bee3f8 | #2c5282 | 線上活動 |
| `.badge-onsite` | #c6f6d5 | #276749 | 實體活動 |
| `.badge-task` | #fbd38d | #7c2d12 | 任務累積 |

---

## 測試案例

### 測試組 1：Online 活動完整流程
```
1. 管理者建立 Online 活動（設定抽獎時間為未來 10 分鐘）
2. 使用者 A 報名 → 應自動核准
3. 使用者 B 報名 → 應自動核准
4. 使用者 A 查看活動詳情 → 應看到連結
5. 管理者嘗試執行抽獎 → 應禁用並顯示提示
6. [等待 10 分鐘或手動調整時間]
7. 管理者執行抽獎 → 應成功抽出 1 位（假設名額=1）
8. 管理者再次執行抽獎 → 應提示已執行過
9. 中獎者查看詳情 → 應看到自己中獎
```

### 測試組 2：OnSite 活動取消報名
```
1. 管理者建立 OnSite 活動（報名時間：現在~未來 1 天）
2. 使用者 A 報名 → 狀態應為 pending
3. 使用者 A 應看到「取消報名」按鈕 → 點擊取消 → 成功
4. 使用者 A 再次報名
5. 管理者核准使用者 A
6. 使用者 A 應看不到「取消報名」按鈕
```

### 測試組 3：Task 任務時間區間
```
1. 管理者建立 Task（期間：1/1~1/31，目標：3次）
2. 使用者 A 在 12/31 參與 Online 活動 → 不計入
3. 使用者 A 在 1/15 參與 Online 活動 → 計入（1/3）
4. 使用者 A 在 1/20 參與 OnSite 活動並簽到 → 計入（2/3）
5. 使用者 A 在 2/1 參與 Online 活動 → 不計入
6. 使用者 A 在 1/25 參與 OnSite 活動並簽到 → 計入（3/3）
7. 應顯示達成標誌和領取按鈕
8. 使用者 A 領取獎勵 → 點數增加
9. 使用者 A 再次嘗試領取 → 應提示已領取
```

---

## 常見錯誤排查

### 錯誤 1：時間比較失敗
**症狀**：報名/簽到/抽獎時間檢查不正確
**原因**：datetime-local 與 ISO 8601 格式混用
**解決**：統一使用 `new Date().getTime()` 進行毫秒數比較

### 錯誤 2：任務進度不累積
**症狀**：參與活動後進度條不變
**原因**：時間戳記未記錄或區間判斷錯誤
**解決**：確保 `approvedTime` 和 `checkedInTime` 正確記錄

### 錯誤 3：資料隔離失效
**症狀**：使用者 A 看到使用者 B 的報名
**原因**：過濾條件錯誤
**解決**：確保 `reg.userName === currentUser`

### 錯誤 4：Modal 不顯示
**症狀**：點擊按鈕後 Modal 沒有彈出
**原因**：`.active` class 未正確添加
**解決**：檢查 `classList.add('active')`

### 錯誤 5：按鈕禁用後仍可點擊
**症狀**：禁用按鈕仍然觸發事件
**原因**：只設定 CSS 沒有設定 `disabled` 屬性
**解決**：使用 `<button disabled>` 或檢查 `if (btn.disabled) return`

---

## 效能優化建議

### 1. 減少 DOM 操作
```javascript
// 不好的做法
registrations.forEach(reg => {
  container.innerHTML += `<div>${reg.userName}</div>`;
});

// 好的做法
let html = '';
registrations.forEach(reg => {
  html += `<div>${reg.userName}</div>`;
});
container.innerHTML = html;
```

### 2. 快取計算結果
```javascript
// 如果任務進度頻繁計算
const progressCache = {};

function calculateUserTaskProgress(userId, taskEvent) {
  const cacheKey = `${userId}_${taskEvent.id}`;
  if (progressCache[cacheKey]) {
    return progressCache[cacheKey];
  }

  // ... 計算邏輯

  progressCache[cacheKey] = count;
  return count;
}

// 資料變更時清除快取
function saveRegistrations(registrations) {
  localStorage.setItem('registrations', JSON.stringify(registrations));
  progressCache = {}; // 清除快取
}
```

### 3. 事件委託
```javascript
// 不要為每個按鈕綁定事件
document.addEventListener('click', function(e) {
  if (e.target.matches('.btn-approve')) {
    const eventId = e.target.dataset.eventId;
    const userName = e.target.dataset.userName;
    approveRegistration(eventId, userName);
  }
});
```

---

## 部署檢查清單

開發完成後，檢查以下項目：

### 程式碼品質
- [ ] 沒有 `console.log` 殘留
- [ ] 沒有未使用的變數或函數
- [ ] 所有函數都有適當的錯誤處理
- [ ] 使用者輸入都有驗證

### 功能完整性
- [ ] 三種活動類型都能正常運作
- [ ] 時間區間控制都正確
- [ ] 取消報名邏輯正確
- [ ] 抽獎機制完整
- [ ] 任務統計準確
- [ ] 點數系統正常

### 使用者體驗
- [ ] 所有按鈕都有 hover 效果
- [ ] 錯誤訊息清晰易懂
- [ ] 載入狀態有適當反饋
- [ ] Modal 可以用 ESC 關閉
- [ ] 表單驗證即時反饋

### 資料安全
- [ ] LocalStorage 正確初始化
- [ ] 資料隔離確實執行
- [ ] 沒有 XSS 漏洞（使用 textContent 而非 innerHTML 處理使用者輸入）
- [ ] 清除資料功能有確認機制

### 瀏覽器相容性
- [ ] Chrome 測試通過
- [ ] Firefox 測試通過
- [ ] Edge 測試通過
- [ ] Safari 測試通過（如適用）

---

## Claude 開發提示

### 建議的開發順序
1. 先建立資料層（LocalStorage 函數）
2. 再建立登入系統（切換介面）
3. 然後實作管理者功能（活動 CRUD）
4. 接著實作使用者功能（報名、簽到）
5. 最後實作任務系統（計算、獎勵）

### 測試驅動開發
每完成一個功能，立即在瀏覽器中測試：
1. 開啟開發者工具的 Console
2. 執行 `localStorage.getItem('events')` 檢查資料
3. 測試邊界情況（空值、過期時間、重複操作）

### 除錯技巧
```javascript
// 在關鍵函數添加日誌
function approveRegistration(eventId, userName) {
  console.log('Approving:', {eventId, userName});
  // ... 邏輯
  console.log('Approved, new status:', reg.status);
}

// 檢查資料結構
console.table(getEvents());
console.table(getRegistrations());
```

---

## 版本資訊

- **當前版本**: 2.2.0
- **最後更新**: 2026-01-27
- **維護者**: AI Assistant
- **授權**: MIT

### 版本歷史
- **v2.2.0** (2026-01-27)
  - 歷史活動顯示未中獎提示
  - 「會議連結」更名為「連結」（支援多種資源類型）
  - 新增 OMO (Online-Merge-Offline) 概念說明
- **v2.1.0** (2026-01-27)
  - 新增歷史活動顯示區域
  - 任務過期後自動隱藏 Banner
  - 活動分類顯示（進行中/歷史）
- **v2.0.0** (2026-01-27)
  - 時間區間管理功能
  - 點數系統與獎勵領取
  - OnSite 取消報名功能
- **v1.0.0** (2026-01-27)
  - 初始版本發布

---

## 相關文件

- **README.md**: 完整需求規格（適合 AI 理解）
- **event-system-spec.md**: 詳細技術文檔（適合維護參考）
- **event.html**: 系統實作檔案

---

**提示**：使用本文件時，建議從「開發任務拆解」章節開始，按階段逐步實作。每個階段完成後，參考「測試案例」進行驗證。
