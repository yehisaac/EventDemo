# 活動報名與任務累積系統 - Claude AI 開發指南

> **版本**: 3.2.0 Modular
> **最後更新**: 2026-01-30
> 本文件專為 Claude AI 優化，提供模組化架構的維護指引

---

## 快速開始

這是一個模組化的活動管理系統，整合報名、審核、簽到、抽獎和任務獎勵功能。

**一句話描述**：使用模組化前端架構（9個 JS 模組 + LocalStorage）實作的 OMO 活動報名系統，支援三種活動類型（Online/OnSite/Task），包含完整的時間控制、點數獎勵和抽獎限制機制。

**核心概念**：
- **OMO (Online-Merge-Offline)**：線上線下融合的活動模式
- **Online 活動**：線上參與，提供連結資源（視訊、直播、文件等），支援抽獎（僅報名截止後）
- **OnSite 活動**：實體現場參與，需簽到驗證，支援動態簽到碼（30秒更新）
- **Task 活動**：跨活動任務追蹤，自動計算參與進度，達標後可領取點數獎勵

**核心技術**：
```
模組化 JavaScript (9 個模組) + LocalStorage + 原生 CSS + qrcode.js
```

**為什麼模組化**：
- ✅ 減少 60-80% AI token 消耗（只需讀取相關模組）
- ✅ 清晰的職責分離，易於維護
- ✅ 團隊協作友善（避免衝突）
- ✅ 測試與除錯更簡單

---

## 系統架構圖

### 模組化架構

```
┌────────────────────────────────────────────────────┐
│              index.html (主入口)                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────┐              ┌──────────────┐   │
│  │ 管理者介面     │              │ 使用者介面     │   │
│  │  (admin.js)   │              │  (user.js)    │   │
│  └──────┬───────┘              └──────┬───────┘   │
│         │                             │           │
│         ├─ 新增/編輯/刪除活動          ├─ 報名活動  │
│         ├─ 審核報名                   ├─ 取消報名  │
│         ├─ 執行抽獎(報名截止後)        ├─ 活動簽到  │
│         ├─ 動態簽到碼顯示(QR Code)     ├─ 領取獎勵  │
│         └─ 查看報名明細               └─ 查看進度  │
│                                                    │
├────────────────────────────────────────────────────┤
│                    核心模組層                       │
├────────────────────────────────────────────────────┤
│  auth.js     │  waitlist.js  │  checkin.js        │
│  (登入認證)   │  (候補遞補)    │  (簽到碼系統)       │
├────────────────────────────────────────────────────┤
│  task.js     │  utils.js     │  config.js         │
│  (任務系統)   │  (工具函數)    │  (全局配置)         │
├────────────────────────────────────────────────────┤
│                  storage.js (資料層)                │
├────────────────────────────────────────────────────┤
│              LocalStorage (瀏覽器存儲)              │
├────────────────────────────────────────────────────┤
│  events          registrations                     │
│  userPoints      taskClaims                        │
└────────────────────────────────────────────────────┘
```

### AI 維護時的最佳實踐

**修改功能時，只需讀取相關模組**：

| 任務 | 需要讀取的檔案 | Token 節省 |
|------|---------------|-----------|
| 修改候補邏輯 | waitlist.js (120 行) | 92% ↓ |
| 調整 UI 樣式 | styles.css (800 行) | 50% ↓ |
| 修改簽到功能 | checkin.js (55 行) | 97% ↓ |
| 新增管理功能 | admin.js (685 行) | 57% ↓ |

**示例**：
```
❌ 單文件版本：需讀取 event.html 全文 (2330 行)
✅ 模組化版本：只需讀取 waitlist.js (120 行)
```

---

## 三種活動類型對比

| 特性 | Online | OnSite | Task |
|------|--------|--------|------|
| **報名方式** | 使用者主動 | 使用者主動 | 系統自動統計 |
| **審核流程** | 自動核准 | 管理者審核 | 不適用 |
| **時間控制** | 報名時間（必填）| 報名+簽到時間（必填）| 任務期間 |
| **必填欄位** | 標題、說明、報名時間 | 標題、說明、報名時間 | 標題、說明、目標、點數 |
| **特殊功能** | 抽獎 | 簽到+取消 | 點數獎勵 |
| **統計條件** | 已核准 | 已核准+已簽到 | 區間內累積 |
| **唯一性** | 多個 | 多個 | 僅一個 |

### Hybrid 混合模式 (v3.2.0)

OnSite 活動可啟用 **Hybrid 混合模式**，同時支援線上與實體參與：

**核心概念**：
- 擴展 OnSite 活動類型，而非新增 type
- 使用者報名時可選擇「實體參與」或「線上參與」
- 實體參與者需簽到，線上參與者免簽到
- 管理者可控制線上參與者是否計入任務統計

**資料欄位（OnSite 專屬）**：
```javascript
{
  allowOnlineView: boolean,      // 啟用 Hybrid 模式
  onlineLink: string,            // 線上連結（視訊、直播等）
  countOnlineForTask: boolean    // 線上參與者是否計入任務統計
}
```

**報名記錄新增欄位**：
```javascript
{
  participationMode: "onsite" | "online"  // 參與方式
}
```

**使用場景**：
- 企業內訓（現場＋遠端同步）
- 混合式發表會（實體會場＋線上直播）
- 大型研討會（允許部分人遠端參與）

**任務統計規則**：
- 實體參與者：`status === "approved" && checkedIn === true`
- 線上參與者：
  - 若 `countOnlineForTask === true`：`status === "approved"`
  - 若 `countOnlineForTask === false`：不計入

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
  ├─ [v3.0.0] 若啟用簽到碼，顯示動態簽到碼區域
  │   ├─ 顯示當前 6 位簽到碼 (大字體)
  │   ├─ 顯示倒數計時 (30 秒)
  │   ├─ 生成並顯示 QR Code (使用 qrcode.js)
  │   └─ 30 秒後自動刷新碼並重新渲染
  ├─ 表格欄位：使用者、報名時間、狀態
  ├─ [v3.0.0] 狀態支援 waitlist，顯示候補順位
  ├─ OnSite 額外欄位：核准時間、簽到狀態、簽到時間
  ├─ 操作按鈕：核准/拒絕（僅 pending 狀態）
  └─ [v3.0.0] 手動遞補按鈕（僅 waitlist 狀態）
- [ ] approveRegistration() - 核准並記錄時間
- [ ] rejectRegistration() - 拒絕報名
  └─ [v3.0.0] 若釋放名額，觸發自動遞補
- [ ] [v3.0.0] promoteWaitlistUser(eventId, userName)
  ├─ 將候補者狀態改為 pending 或 approved
  ├─ 清除 waitlistPosition 和 waitlistTime
  └─ 更新其他候補者順位
- [ ] [v3.0.0] promoteFromWaitlist(eventId)
  ├─ 自動將候補名單第一位遞補
  ├─ Online: 直接改為 approved
  ├─ OnSite: 改為 pending
  └─ 更新所有候補者順位
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
  ├─ [v3.0.0] 檢查報名人數上限 (maxParticipants > 0)
  │   ├─ 未達上限：正常報名
  │   ├─ Online 達上限：拒絕報名
  │   └─ OnSite 達上限：進入候補名單 (status = "waitlist")
  ├─ Online: status = "approved", 記錄 approvedTime
  ├─ OnSite: status = "pending"
  └─ Waitlist: 記錄 waitlistTime 和 waitlistPosition
- [ ] cancelRegistration(eventId)
  ├─ 條件：status === "pending"
  ├─ 動作：從陣列移除
  └─ [v3.0.0] 若佔用名額，觸發自動遞補 (promoteFromWaitlist)
- [ ] [v3.0.0] cancelWaitlist(eventId)
  ├─ 條件：status === "waitlist"
  ├─ 動作：從陣列移除
  └─ 更新後續候補者順位
```

**任務 3.2：簽到系統**
```javascript
- [ ] checkIn(eventId)
  ├─ 檢查：status === "approved"
  ├─ 檢查：簽到時間區間
  ├─ [v3.0.0] 若啟用簽到碼 (checkinCodeEnabled)
  │   ├─ 提示使用者輸入 6 位簽到碼
  │   ├─ 驗證簽到碼正確性 (validateCheckinCode)
  │   └─ 驗證簽到碼有效期 (30 秒內)
  └─ 記錄：checkedIn = true, checkedInTime
- [ ] [v3.0.0] generateCheckinCode()
  └─ 生成 6 位字母數字組合 (排除易混淆字元)
- [ ] [v3.0.0] updateCheckinCode(eventId)
  ├─ 生成新簽到碼
  ├─ 記錄生成時間 (generatedAt)
  └─ 儲存到 event.currentCheckinCode
- [ ] [v3.0.0] validateCheckinCode(eventId, inputCode)
  ├─ 檢查簽到碼是否存在
  ├─ 檢查有效期 (30 秒內)
  └─ 比對輸入碼與當前碼
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
- [ ] renderUserScreen() 活動分類與顯示
  ├─ 分離進行中活動和歷史活動
  ├─ 進行中：正常顯示，可互動
  ├─ 歷史活動：半透明顯示，只能查看詳情
  └─ 活動卡片：顯示報名開始/結束時間（registrationStartTime ~ registrationEndTime）
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

### OnSite 活動報名狀態流轉 (v3.0.0 更新)
```
[未報名]
   ↓ registerEvent()
   ├─→ 未達上限: [pending] ←─────────────┐
   │      ├─→ 可取消報名              │
   │      ↓ approveRegistration()     │
   │   [approved] ───────────────────┘ 不可取消
   │      ↓ checkIn() (可選：需簽到碼驗證)
   │   [approved + checkedIn]
   │
   └─→ 達上限: [waitlist] (候補名單)
          ├─→ 可取消候補 (cancelWaitlist)
          ├─→ 手動遞補 (promoteWaitlistUser)
          └─→ 自動遞補 (名額釋放時)
             └─→ [pending] 繼續正常流程
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

- **當前版本**: 3.2.0 Modular
- **最後更新**: 2026-01-30
- **維護者**: AI Assistant
- **授權**: MIT

### 版本歷史
- **v3.0.0** (2026-01-27)
  - UI 全面優化：漸層背景、陰影效果、動畫轉場、玻璃擬態效果
  - 報名人數上限功能 (maxParticipants)
  - 候補名單機制 (waitlist status)：自動/手動遞補、候補順位管理
  - OnSite 動態簽到碼系統 (6 位字母數字，每 30 秒刷新)
  - QR Code 簽到支援 (整合 qrcode.js library)
  - 管理者簽到碼顯示界面 (實時倒數計時、QR Code 生成)
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

- **v3.2.0** (2026-01-28) 🎯 **目前版本**
  - ✅ Hybrid 混合模式（OnSite 活動支援線上＋實體同時進行）
  - ✅ 使用者可選擇參與方式（實體參與需簽到、線上參與免簽到）
  - ✅ 管理者可設定線上參與者是否計入任務統計（countOnlineForTask）
  - ✅ 報名明細顯示參與方式（線上/實體）
  - ✅ 任務計算邏輯支援 Hybrid 模式統計
  - ✅ 抽獎限制：每個活動只能執行一次抽獎
  - ✅ 活動列表按創建時間降序排列
  - ✅ 完整的單元測試覆蓋（50+ 測試案例）
  - ✅ 管理者介面頁籤分類（線上活動/實體活動/任務活動）
  - ✅ 即時顯示各類型活動數量標籤
  - ✅ 空狀態提示優化

- **v3.1.0** (2026-01-28)
  - ✅ 完整模組化架構（9 個獨立 JavaScript 模組）
  - ✅ 抽獎時間限制（Online 活動僅在報名截止後可執行抽獎）
  - ✅ 管理者統計卡片實時更新（總活動數、總報名數、待審核數）
  - ✅ 移除單文件版本，專注模組化維護
  - ✅ Token 優化：相比單文件版本減少 60-80% AI token 消耗

---

## 模組化維護指南

### 修改特定功能時的最佳實踐

**1. 修改候補邏輯** → 只需讀取 `js/waitlist.js` (120 行)

**2. 調整簽到功能** → 只需讀取 `js/checkin.js` (60 行)

**3. 修改抽獎邏輯** → 只需讀取 `js/admin.js` 中的 `executeDraw()` 函數

**4. 新增全局配置** → 只需修改 `js/config.js` (10 行)

### AI 維護時的提示詞範例

```
"請修改 js/waitlist.js 中的 promoteFromWaitlist 函數，
使其在遞補時記錄遞補時間"
```

```
"請在 js/admin.js 的 renderAdminScreen 中添加一個
顯示候補人數的統計卡片"
```

---

## 相關文件

- **README.md**: 系統功能規格（適合 AI 理解）
- **README-MODULAR.md**: 模組化架構說明（架構文檔）
- **event-system-spec.md**: 詳細技術文檔（適合維護參考）
- **index.html**: 系統主入口
- **js/\*.js**: 9 個模組化 JavaScript 檔案
- **css/styles.css**: 所有 UI 樣式

---

**提示**：使用本文件時，建議先閱讀「模組化維護指南」了解架構，再參考具體章節進行開發。每個功能都應該定位到對應的模組進行修改，以最大化 AI token 效率。
