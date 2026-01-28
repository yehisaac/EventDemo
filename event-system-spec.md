# 活動報名與任務累積系統 - 技術規格文件

> **版本**: 3.0.0
> **最後更新**: 2026-01-27
> **檔案**: event.html

---

## 目錄

- [系統概述](#系統概述)
- [技術架構](#技術架構)
- [角色與權限](#角色與權限)
- [活動類型定義](#活動類型定義)
- [資料模型](#資料模型)
- [核心功能模組](#核心功能模組)
- [UI/UX 規格](#uiux-規格)
- [函數與 API 說明](#函數與-api-說明)
- [使用流程](#使用流程)
- [更新與維護](#更新與維護)

---

## 系統概述

本系統為一個整合「活動管理」與「里程碑任務」的 DEMO 平台。除了基礎的活動報名與審核外，新增了任務累積機制，透過自動統計參與次數來獎勵使用者，提升互動體驗。

### 核心概念
- 支援 **OMO (Online-Merge-Offline)** 活動模式
- **Online 活動**: 線上參與，可提供連結（視訊會議、線上直播、資源連結等）
- **OnSite 活動**: 實體現場參與，需簽到驗證
- 兩種模式可靈活組合，實現線上線下融合的活動體驗

### 核心特色
- 單一 HTML 檔案實現完整功能
- 純前端解決方案，無需後端伺服器
- LocalStorage 資料持久化
- 即時統計與進度追蹤
- 多角色權限控制
- 進行中活動與歷史活動自動分類

---

## 技術架構

### 技術棧
- **HTML5**: 結構與語意化標籤
- **CSS3**: 漸層、動畫、Flexbox、Grid 排版、Glassmorphism (玻璃擬態)
- **Vanilla JavaScript**: 無框架依賴，純原生 JS
- **LocalStorage API**: 瀏覽器端資料儲存
- **QRCode.js**: QR Code 生成庫 (v1.5.3) - 用於簽到碼掃描

### 檔案結構
```
event.html
├── <style>        # CSS 樣式定義
├── <body>         # HTML 結構
│   ├── 登入畫面
│   ├── 管理者介面
│   ├── 使用者介面
│   └── Modal 彈窗
└── <script>       # JavaScript 邏輯
    ├── 資料模型
    ├── 登入系統
    ├── 任務統計
    ├── 管理者功能
    └── 使用者功能
```

### 儲存架構
```javascript
localStorage
├── events          // 活動列表 (JSON Array)
├── registrations   // 報名記錄 (JSON Array)
├── userPoints      // 使用者點數 (JSON Object: {userId: points})
└── taskClaims      // 任務領取記錄 (JSON Object: {userId: {taskId: boolean}})
```

---

## 角色與權限

### 管理者 (Admin)
**登入方式**: 點擊「管理者」按鈕直接登入

**權限清單**:
- ✅ 新增、編輯、刪除活動
- ✅ 查看所有報名明細
- ✅ 審核 OnSite 活動報名 (核准/拒絕)
- ✅ 執行 Online 活動抽獎
- ✅ 查看統計數據 (總活動數、總報名數、待審核數)
- ✅ 一鍵清除所有資料

**限制**:
- ❌ 無法以使用者身份報名活動
- ❌ 無法查看個人任務進度

### 使用者 (User)
**登入方式**: 輸入自定義 User ID

**權限清單**:
- ✅ 報名 Online 和 OnSite 活動
- ✅ 查看個人任務進度與累積點數
- ✅ OnSite 活動簽到 (需先核准且在簽到時間內)
- ✅ OnSite 活動取消報名 (僅在核准前)
- ✅ 查看活動詳情
- ✅ 查看中獎名單 (遮罩顯示)
- ✅ 查看個人報名、核准、簽到時間
- ✅ 領取任務完成獎勵點數

**限制**:
- ❌ 無法看到其他使用者的報名狀態
- ❌ 無法報名 Task 類型活動
- ❌ 未核准前無法查看 Online 活動連結
- ❌ 核准後無法取消報名

---

## 活動類型定義

### 1. Online (線上活動)

#### 屬性
| 欄位 | 類型 | 說明 | 必填 |
|------|------|------|------|
| `type` | String | 固定值 "Online" | ✅ |
| `title` | String | 活動標題 | ✅ |
| `description` | String | 活動說明 | ✅ |
| `link` | String | 連結 (URL) | ⭕ |
| `registrationStartTime` | String (datetime-local) | 報名開始時間 | ✅ |
| `registrationEndTime` | String (datetime-local) | 報名結束時間 | ✅ |
| `drawSlots` | Number | 抽獎名額 | ⭕ |
| `lastDrawTime` | String (ISO) | 最後執行抽獎的時間戳記 | ❌ |

#### 報名規則
- 必須在報名時間區間內才能報名（`registrationStartTime` ~ `registrationEndTime`）
- 點擊報名後自動設為 `status: "approved"`
- 無需管理者審核
- 報名成功不顯示「已自動核准」提示

#### 統計規則
- 只要 `status === "approved"` 即計入任務累積次數
- 使用 `approvedTime` 作為參與時間點
- 無需簽到

#### 特殊功能
- **抽獎機制**:
  - 管理者可執行抽獎，隨機選出指定名額
  - 必須等待報名結束後（`registrationEndTime`）才能執行
  - 每個活動只能執行一次抽獎
  - 按鈕上有 hover 提示顯示狀態（報名尚未結束/已執行/可執行）
- **連結保護**: 使用者需報名核准後才能查看連結

---

### 2. OnSite (實體活動)

#### 屬性
| 欄位 | 類型 | 說明 | 必填 |
|------|------|------|------|
| `type` | String | 固定值 "OnSite" | ✅ |
| `title` | String | 活動標題 | ✅ |
| `description` | String | 活動說明 | ✅ |
| `location` | String | 活動地點 | ⭕ |
| `registrationStartTime` | String (datetime-local) | 報名開始時間 | ✅ |
| `registrationEndTime` | String (datetime-local) | 報名結束時間 | ✅ |
| `checkinStartTime` | String (datetime-local) | 簽到開始時間 | ⭕ |
| `checkinEndTime` | String (datetime-local) | 簽到結束時間 | ⭕ |

#### 報名規則
- 點擊報名後設為 `status: "pending"`
- 需管理者手動審核
- 報名需在 `registrationStartTime` 和 `registrationEndTime` 之間
- 審核通過後顯示簽到按鈕
- **核准前可以取消報名**
- **核准後不可取消報名**

#### 統計規則
- 必須同時滿足以下條件才計入任務次數:
  1. `status === "approved"`
  2. `checkedIn === true`
- 使用 `checkedInTime` 作為參與時間點

#### 特殊功能
- **簽到系統**:
  - 核准後使用者可點擊簽到按鈕
  - 簽到需在 `checkinStartTime` 和 `checkinEndTime` 之間
  - 簽到時記錄 `checkedInTime`
- **審核流程**: 管理者可在報名明細中核准或拒絕
- **取消報名**: 待審核狀態可取消，已核准狀態不可取消

---

### 3. Task (任務累積型)

#### 屬性
| 欄位 | 類型 | 說明 | 必填 |
|------|------|------|------|
| `type` | String | 固定值 "Task" | ✅ |
| `title` | String | 任務標題 | ✅ |
| `description` | String | 任務說明 | ✅ |
| `startTime` | String (datetime-local) | 任務開始時間 | ⭕ |
| `endTime` | String (datetime-local) | 任務結束時間 | ⭕ |
| `taskGoal` | Number | 目標參加次數 | ✅ |
| `taskPoints` | Number | 獎勵點數 | ✅ |

#### 限制條件
- **唯一性**: 系統同時只能存在一個 Task 活動
- **不可報名**: 使用者無法主動報名
- **自動統計**: 系統根據 Online 和 OnSite 參與情況自動計算
- **時間區間**: 只計算在 `startTime` 和 `endTime` 區間內的活動參與

#### 統計邏輯
```javascript
// 計算使用者的任務進度（區間內）
Online 活動: status === "approved" && approvedTime 在區間內 → 計入 +1
OnSite 活動: status === "approved" && checkedIn === true && checkedInTime 在區間內 → 計入 +1
```

#### 達成條件
- 當使用者累積次數 `>= taskGoal` 時，顯示達成標誌
- 達成後顯示「領取獎勵」按鈕
- 點擊按鈕後獲得點數，點數累加到使用者帳戶
- 每個任務只能領取一次
- 任務過期後無法領取獎勵

#### 特殊功能
- **點數系統**: 完成任務後可領取點數獎勵
- **進度追蹤**: 即時顯示進度條和完成狀態
- **時間控制**: 顯示任務期間，過期後標記為已過期

---

## 資料模型

### Event (活動)

```typescript
interface Event {
  id: string;              // 唯一識別碼，格式: "evt_timestamp"
  type: "Online" | "OnSite" | "Task";
  title: string;
  description: string;

  // Online 專屬
  link?: string;                    // 連結
  registrationStartTime?: string;   // 報名開始時間 (datetime-local)
  registrationEndTime?: string;     // 報名結束時間 (datetime-local)
  drawSlots?: number;               // 抽獎名額
  lastDrawTime?: string;            // 最後執行抽獎時間 (ISO 8601)
  maxParticipants?: number;         // 報名人數上限，0 = 無限制 (v3.0.0)

  // OnSite 專屬
  location?: string;                // 活動地點
  registrationStartTime?: string;   // 報名開始時間 (datetime-local)
  registrationEndTime?: string;     // 報名結束時間 (datetime-local)
  checkinStartTime?: string;        // 簽到開始時間 (datetime-local)
  checkinEndTime?: string;          // 簽到結束時間 (datetime-local)
  maxParticipants?: number;         // 報名人數上限，0 = 無限制 (v3.0.0)
  checkinCodeEnabled?: boolean;     // 是否啟用動態簽到碼 (v3.0.0)
  currentCheckinCode?: {            // 當前簽到碼 (v3.0.0)
    code: string;                   // 6 位字母數字組合
    generatedAt: string;            // 生成時間 (ISO 8601)
  }

  // Task 專屬
  startTime?: string;      // 任務開始時間 (datetime-local)
  endTime?: string;        // 任務結束時間 (datetime-local)
  taskGoal?: number;       // 目標次數
  taskPoints?: number;     // 獎勵點數
}
```

### Registration (報名記錄)

```typescript
interface Registration {
  eventId: string;         // 對應的活動 ID
  userName: string;        // 使用者 ID
  timestamp: string;       // 報名時間 (ISO 8601)
  status: "pending" | "approved" | "rejected" | "waitlist";  // v3.0.0 新增 waitlist
  checkedIn: boolean;      // 是否已簽到 (OnSite 專用)
  isWinner: boolean;       // 是否中獎 (Online 抽獎用)
  approvedTime?: string;   // 核准時間 (ISO 8601)
  checkedInTime?: string;  // 簽到時間 (ISO 8601)
  waitlistPosition?: number;  // 候補順位 (v3.0.0)
  waitlistTime?: string;      // 加入候補時間 (ISO 8601) (v3.0.0)
}
```

### UserPoints (使用者點數)

```typescript
interface UserPoints {
  [userId: string]: number;  // 使用者ID: 累積點數
}
```

### TaskClaims (任務領取記錄)

```typescript
interface TaskClaims {
  [userId: string]: {
    [taskId: string]: boolean;  // 任務ID: 是否已領取
  };
}
```

### LocalStorage 結構

```json
{
  "events": [
    {
      "id": "evt_1738012345678",
      "type": "Online",
      "title": "前端技術分享會",
      "description": "探討 2026 年最新前端趨勢",
      "link": "https://meet.example.com/abc123",
      "drawSlots": 5,
      "drawTime": "2026-01-30T15:00",
      "lastDrawTime": "2026-01-30T15:30:00.000Z"
    },
    {
      "id": "evt_1738012345679",
      "type": "OnSite",
      "title": "實體工作坊",
      "description": "手把手教學",
      "location": "台北市信義區",
      "registrationStartTime": "2026-01-27T09:00",
      "registrationEndTime": "2026-02-01T12:00",
      "checkinStartTime": "2026-02-01T13:00",
      "checkinEndTime": "2026-02-01T18:00"
    },
    {
      "id": "evt_1738012345680",
      "type": "Task",
      "title": "活動達人任務",
      "description": "參加 5 場活動獲得獎勵",
      "startTime": "2026-01-01T00:00",
      "endTime": "2026-02-28T23:59",
      "taskGoal": 5,
      "taskPoints": 100
    }
  ],
  "registrations": [
    {
      "eventId": "evt_1738012345678",
      "userName": "user001",
      "timestamp": "2026-01-27T10:00:00.000Z",
      "status": "approved",
      "approvedTime": "2026-01-27T10:00:00.000Z",
      "checkedIn": false,
      "isWinner": true
    },
    {
      "eventId": "evt_1738012345679",
      "userName": "user001",
      "timestamp": "2026-01-27T10:05:00.000Z",
      "status": "approved",
      "approvedTime": "2026-01-28T09:00:00.000Z",
      "checkedIn": true,
      "checkedInTime": "2026-02-01T14:30:00.000Z",
      "isWinner": false
    }
  ],
  "userPoints": {
    "user001": 250,
    "user002": 100
  },
  "taskClaims": {
    "user001": {
      "evt_1738012345680": true
    }
  }
}
```

---

## 核心功能模組

### 1. 登入系統

#### 函數列表
- `loginAsAdmin()`: 管理者登入
- `showUserLogin()`: 顯示使用者登入表單
- `loginAsUser()`: 使用者登入 (需輸入 ID)
- `logout()`: 登出並返回登入畫面

#### 狀態管理
```javascript
let currentUser = null;   // 當前登入的使用者 ID
let currentRole = null;   // "admin" | "user"
```

---

### 2. 資料管理

#### 初始化
```javascript
initStorage()  // 初始化 LocalStorage
```

#### CRUD 操作
```javascript
// 讀取
getEvents()           // 取得所有活動
getRegistrations()    // 取得所有報名記錄

// 儲存
saveEvents(events)              // 儲存活動列表
saveRegistrations(registrations) // 儲存報名記錄

// 清除
resetAllData()  // 清除所有資料 (需確認)
```

---

### 3. 任務統計系統

#### 核心函數
```javascript
calculateUserTaskProgress(userId)
```

**邏輯流程**:
1. 取得該使用者的所有報名記錄
2. 過濾出非 Task 類型的活動
3. 統計符合條件的次數:
   - Online: `status === "approved"`
   - OnSite: `status === "approved" && checkedIn === true`
4. 回傳累積次數

**回傳值**: `number` (累積參與次數)

---

### 4. 活動管理 (管理者)

#### 新增/編輯活動
```javascript
showAddEventModal()           // 開啟新增活動 Modal
editEvent(eventId)            // 編輯指定活動
handleEventTypeChange()       // 活動類型切換時的欄位顯示控制
```

**驗證規則**:
- Task 類型唯一性檢查
- 必填欄位驗證
- 數值欄位最小值限制

#### 刪除活動
```javascript
deleteEvent(eventId)
```
**行為**:
- 刪除活動本身
- 同步刪除所有相關報名記錄
- 需使用者確認

#### 報名管理
```javascript
viewRegistrations(eventId)            // 查看報名明細
approveRegistration(eventId, userName) // 核准報名
rejectRegistration(eventId, userName)  // 拒絕報名
```

#### 抽獎功能
```javascript
executeDraw(eventId)
```

**流程**:
1. 檢查活動是否有設定抽獎名額
2. 篩選符合資格的參與者 (`status === "approved"` 且 `isWinner === false`)
3. 隨機抽選指定數量
4. 標記中獎者 `isWinner = true`
5. 記錄抽獎時間

---

### 5. 使用者功能

#### 報名活動
```javascript
registerEvent(eventId)
```

**流程**:
1. 檢查是否已報名
2. 建立報名記錄
3. Online 活動自動核准 (`status: "approved"`)
4. OnSite 活動設為待審核 (`status: "pending"`)

#### 簽到功能
```javascript
checkIn(eventId)
```

**條件**:
- 必須為 OnSite 活動
- 報名狀態必須是 `approved`
- 尚未簽到

#### 查看詳情
```javascript
viewEventDetail(eventId)
```

**顯示內容**:
- 活動基本資訊
- 連結 (Online 且已核准)
- 中獎名單 (遮罩處理)

#### ID 遮罩處理
```javascript
maskUserId(userId)
```

**規則**:
- 保留首尾字元
- 中間替換為 4 個星號
- 範例: `"user12345"` → `"u****5"`

---

## UI/UX 規格

### 設計系統

#### 色彩配置
```css
/* 主色調 */
Primary Purple:     #667eea
Secondary Purple:   #764ba2

/* 漸層背景 */
Background Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

/* 任務 Banner 漸層 */
Task Banner:        linear-gradient(135deg, #f093fb 0%, #f5576c 100%)

/* 進度條漸層 */
Progress Bar:       linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)

/* 狀態色 */
Success:  #48bb78
Warning:  #ed8936
Danger:   #f56565
Info:     #4299e1

/* 中性色 */
Gray-100: #f7fafc
Gray-200: #e2e8f0
Gray-500: #a0aec0
Gray-700: #2d3748
```

#### 排版規範
```css
/* 字體 */
Font Family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif

/* 標題 */
H1: 24px - 32px
H2: 20px - 24px
H3: 18px - 20px

/* 內文 */
Body: 14px
Small: 12px

/* 行高 */
Line Height: 1.6
```

#### 元件規格

##### 按鈕 (Button)
```css
Padding:        10px 20px
Border Radius:  8px
Font Size:      14px
Font Weight:    600
Transition:     all 0.3s

/* 變體 */
.btn-primary:   #667eea
.btn-success:   #48bb78
.btn-danger:    #f56565
.btn-warning:   #ed8936
.btn-secondary: #a0aec0
```

##### 卡片 (Card)
```css
Background:     white
Border Radius:  15px
Padding:        25px
Box Shadow:     0 4px 15px rgba(0,0,0,0.1)
Hover Effect:   translateY(-5px)
```

##### 進度條 (Progress Bar)
```css
Container:
  Background:     rgba(255,255,255,0.3)
  Border Radius:  20px
  Height:         30px

Bar:
  Background:     linear-gradient(90deg, #4facfe, #00f2fe)
  Transition:     width 0.5s ease
```

##### 狀態標籤 (Badge)
```css
Padding:        4px 10px
Border Radius:  12px
Font Size:      12px
Font Weight:    bold

/* 類型標籤 */
.badge-online:  #bee3f8 (bg) / #2c5282 (text)
.badge-onsite:  #c6f6d5 (bg) / #276749 (text)
.badge-task:    #fbd38d (bg) / #7c2d12 (text)

/* 狀態標籤 */
.status-pending:   #fef3c7 (bg) / #92400e (text)
.status-approved:  #d1fae5 (bg) / #065f46 (text)
.status-rejected:  #fee2e2 (bg) / #991b1b (text)
```

---

### 畫面配置

#### 登入畫面
```
┌─────────────────────────────────┐
│   🎯 活動報名與任務系統          │
│                                 │
│   請選擇身份：                   │
│   ┌────────┐  ┌────────┐       │
│   │ 管理者  │  │ 使用者  │       │
│   └────────┘  └────────┘       │
│                                 │
│   (使用者登入表單)               │
│   使用者 ID: [_________]         │
│              [登入按鈕]          │
└─────────────────────────────────┘
```

#### 管理者介面
```
┌─────────────────────────────────────────┐
│ 👨‍💼 管理者控制台    [➕新增] [🗑️清除] [登出] │
├─────────────────────────────────────────┤
│ 統計卡片: [總活動數] [總報名數] [待審核]  │
├─────────────────────────────────────────┤
│ 活動列表:                                │
│ ┌─────────────────────────────────────┐ │
│ │ 活動標題          [Online]           │ │
│ │ 說明文字                             │ │
│ │ [報名明細] [執行抽獎] [編輯] [刪除]   │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ...更多活動                          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 使用者介面
```
┌─────────────────────────────────────────┐
│ 👤 歡迎，user001                    [登出] │
├─────────────────────────────────────────┤
│ 🎯 任務進度 Banner (漸層背景)             │
│ 活動達人任務                             │
│ ▓▓▓▓▓▓░░░░ 3 / 5                       │
│ 目前進度: 3 次參與     獎勵: 100 點      │
├─────────────────────────────────────────┤
│ 活動卡片 Grid:                           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ 活動 A   │ │ 活動 B   │ │ 活動 C   │   │
│ │ [報名]   │ │ [簽到]   │ │ [詳情]   │   │
│ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
```

---

### 互動動效

#### 按鈕 Hover
```css
transform: translateY(-2px);
transition: transform 0.2s;
```

#### 卡片 Hover
```css
transform: translateY(-5px);
transition: transform 0.3s;
box-shadow: 0 6px 20px rgba(0,0,0,0.15);
```

#### 達成動畫
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
animation: pulse 1s infinite;
```

#### 進度條動畫
```css
transition: width 0.5s ease;
```

---

## 函數與 API 說明

### 全域變數

```javascript
let currentUser = null;    // 當前使用者 ID (string)
let currentRole = null;    // 當前角色 ("admin" | "user")
```

---

### Storage API

#### `initStorage()`
初始化 LocalStorage，若不存在則建立空陣列。

**呼叫時機**: 頁面載入時

```javascript
function initStorage() {
  if (!localStorage.getItem('events')) {
    localStorage.setItem('events', JSON.stringify([]));
  }
  if (!localStorage.getItem('registrations')) {
    localStorage.setItem('registrations', JSON.stringify([]));
  }
}
```

---

#### `getEvents()`
取得所有活動資料。

**回傳**: `Event[]`

```javascript
function getEvents() {
  return JSON.parse(localStorage.getItem('events') || '[]');
}
```

---

#### `saveEvents(events)`
儲存活動列表。

**參數**:
- `events` (Event[]): 活動陣列

```javascript
function saveEvents(events) {
  localStorage.setItem('events', JSON.stringify(events));
}
```

---

#### `getRegistrations()`
取得所有報名記錄。

**回傳**: `Registration[]`

```javascript
function getRegistrations() {
  return JSON.parse(localStorage.getItem('registrations') || '[]');
}
```

---

#### `saveRegistrations(registrations)`
儲存報名記錄列表。

**參數**:
- `registrations` (Registration[]): 報名記錄陣列

```javascript
function saveRegistrations(registrations) {
  localStorage.setItem('registrations', JSON.stringify(registrations));
}
```

---

### 登入系統 API

#### `loginAsAdmin()`
管理者登入，無需輸入帳密。

**行為**:
- 設定 `currentRole = "admin"`
- 切換到管理者介面
- 渲染管理者畫面

---

#### `showUserLogin()`
顯示使用者登入表單。

**行為**:
- 移除 `.hidden` class 顯示輸入框

---

#### `loginAsUser()`
使用者登入，需輸入 User ID。

**驗證**:
- User ID 不可為空

**行為**:
- 設定 `currentUser` 和 `currentRole`
- 切換到使用者介面
- 渲染使用者畫面

---

#### `logout()`
登出並返回登入畫面。

**行為**:
- 清空 `currentUser` 和 `currentRole`
- 隱藏所有介面
- 顯示登入畫面
- 重置表單

---

#### `resetAllData()`
清除所有 LocalStorage 資料。

**確認機制**: 需使用者確認

**行為**:
- `localStorage.clear()`
- 重新初始化 Storage
- 重新渲染畫面

---

### 任務統計 API

#### `calculateUserTaskProgress(userId)`
計算指定使用者的任務進度。

**參數**:
- `userId` (string): 使用者 ID

**回傳**: `number` (累積次數)

**邏輯**:
```javascript
Online 活動:  status === "approved" → count++
OnSite 活動:  status === "approved" && checkedIn === true → count++
Task 活動:    不計入
```

**範例**:
```javascript
const progress = calculateUserTaskProgress("user001");
// 回傳: 3 (該使用者累積參與 3 次)
```

---

### 管理者功能 API

#### `renderAdminScreen()`
渲染管理者介面，包含統計與活動列表。

**資料來源**:
- `getEvents()`
- `getRegistrations()`

**更新內容**:
- 統計數字
- 活動卡片列表
- 報名明細連結

---

#### `showAddEventModal()`
開啟新增活動 Modal。

**行為**:
- 清空表單
- 設定標題為「新增活動」
- 顯示 Modal
- 執行欄位控制

---

#### `editEvent(eventId)`
開啟編輯活動 Modal 並填入現有資料。

**參數**:
- `eventId` (string): 活動 ID

**行為**:
- 從 LocalStorage 讀取活動資料
- 填入表單
- 設定標題為「編輯活動」
- 顯示 Modal

---

#### `deleteEvent(eventId)`
刪除指定活動及其所有報名記錄。

**參數**:
- `eventId` (string): 活動 ID

**確認機制**: 需使用者確認

**行為**:
- 從 `events` 陣列移除
- 從 `registrations` 陣列移除相關記錄
- 重新渲染畫面

---

#### `handleEventTypeChange()`
活動類型切換時的欄位顯示控制。

**行為**:
- 隱藏所有類型專屬欄位
- 根據選擇的類型顯示對應欄位
- Task 類型時檢查唯一性並顯示警告

---

#### `closeEventModal()`
關閉活動編輯 Modal。

---

#### `viewRegistrations(eventId)`
顯示指定活動的報名明細 Modal。

**參數**:
- `eventId` (string): 活動 ID

**顯示內容**:
- 使用者 ID
- 報名時間 (本地化顯示)
- 狀態標籤
- 簽到狀態 (OnSite)
- 中獎標記
- 操作按鈕 (核准/拒絕)

---

#### `closeRegistrationsModal()`
關閉報名明細 Modal。

---

#### `approveRegistration(eventId, userName)`
核准指定使用者的報名。

**參數**:
- `eventId` (string): 活動 ID
- `userName` (string): 使用者 ID

**行為**:
- 設定 `status = "approved"`
- 儲存變更
- 刷新報名明細畫面

---

#### `rejectRegistration(eventId, userName)`
拒絕指定使用者的報名。

**參數**:
- `eventId` (string): 活動 ID
- `userName` (string): 使用者 ID

**行為**:
- 設定 `status = "rejected"`
- 儲存變更
- 刷新報名明細畫面

---

#### `executeDraw(eventId)`
執行線上活動抽獎。

**參數**:
- `eventId` (string): 活動 ID

**條件檢查**:
- 活動類型必須是 Online
- `drawSlots > 0`
- 存在符合資格的參與者

**篩選條件**:
- `status === "approved"`
- `isWinner === false`

**流程**:
1. 隨機排序符合資格的報名記錄
2. 取前 N 筆 (N = `drawSlots`)
3. 設定 `isWinner = true`
4. 記錄 `drawTime` (ISO 8601)
5. 儲存變更
6. 顯示完成訊息

---

### 使用者功能 API

#### `isEventExpired(event)`
判斷活動是否已過期。

**參數**:
- `event` (Event): 活動物件

**回傳**: `boolean` (true 表示已過期)

**邏輯**:
```javascript
Online 活動: lastDrawTime 存在 → true
OnSite 活動: now > checkinEndTime 或 now > registrationEndTime → true
其他情況: false
```

**範例**:
```javascript
const event = getEvents().find(e => e.id === eventId);
if (isEventExpired(event)) {
  // 顯示在歷史活動區域
}
```

---

#### `renderUserScreen()`
渲染使用者介面，包含任務進度與活動列表。

**資料來源**:
- `getEvents()`
- `getRegistrations()`
- `calculateUserTaskProgress(currentUser)`
- `isEventExpired(event)` - 判斷活動分類

**更新內容**:
- 任務進度 Banner（過期任務不顯示）
- 進行中活動列表
- 歷史活動列表（半透明顯示）
- 報名狀態顯示
- 中獎標記
- 活動時間資訊（報名開始 ~ 報名結束）

**活動分類**:
- 進行中：未過期的活動，顯示完整操作按鈕
- 歷史：已過期的活動，只顯示查看詳情按鈕

**活動時間顯示**:
```javascript
// 在活動卡片中顯示報名期間
if (event.registrationStartTime && event.registrationEndTime) {
  顯示: 📅 報名期間: MM/DD HH:mm ~ MM/DD HH:mm
  樣式: 灰色文字、小字體（13px）
}
```

**中獎狀態顯示** (歷史活動 - Online 活動專用):
```javascript
// 已中獎者
if (userReg.isWinner) {
  顯示: <div class="winner-badge">🎉 您已中獎！</div>
  樣式: 金色背景、白色文字
}
// 未中獎者（已參與但未抽中）
else if (userReg.status === 'approved' && event.lastDrawTime) {
  顯示: <div class="info-text">💔 未中獎</div>
  樣式: 黃色背景、深黃色文字
}
```

---

#### `registerEvent(eventId)`
使用者報名活動。

**參數**:
- `eventId` (string): 活動 ID

**驗證**:
- 檢查是否已報名 (避免重複)

**行為**:
- 建立 `Registration` 物件
- Online: 自動核准 (`status: "approved"`)
- OnSite: 待審核 (`status: "pending"`)
- 儲存到 LocalStorage
- 重新渲染畫面

**範例**:
```javascript
{
  eventId: "evt_123",
  userName: "user001",
  timestamp: "2026-01-27T10:00:00.000Z",
  status: "approved",  // Online 自動核准
  checkedIn: false,
  isWinner: false
}
```

---

#### `checkIn(eventId)`
使用者簽到 (OnSite 活動專用)。

**參數**:
- `eventId` (string): 活動 ID

**條件檢查**:
- 報名記錄存在
- `status === "approved"`
- `checkedIn === false`

**行為**:
- 設定 `checkedIn = true`
- 儲存變更
- 顯示成功訊息
- 重新渲染畫面

---

#### `viewEventDetail(eventId)`
顯示活動詳情 Modal。

**參數**:
- `eventId` (string): 活動 ID

**顯示內容**:
- 活動標題與類型
- 活動說明
- 連結 (Online 且已核准)
- 地點與時間 (OnSite)
- 中獎名單 (遮罩處理)

**範例 (連結保護)**:
```javascript
if (userReg && userReg.status === 'approved' && event.link) {
  // 顯示連結
} else {
  // 顯示提示訊息
}
```

---

#### `closeEventDetailModal()`
關閉活動詳情 Modal。

---

#### `maskUserId(userId)`
遮罩使用者 ID，保護隱私。

**參數**:
- `userId` (string): 原始使用者 ID

**回傳**: `string` (遮罩後的 ID)

**規則**:
- 長度 ≤ 2: 不遮罩
- 長度 > 2: 保留首尾，中間替換為 4 個星號

**範例**:
```javascript
maskUserId("A")         // "A"
maskUserId("AB")        // "AB"
maskUserId("ABC")       // "A****C"
maskUserId("user123")   // "u****3"
maskUserId("admin001")  // "a****1"
```

---

### 表單事件處理

#### Event Form Submit
處理活動新增/編輯表單提交。

**驗證規則**:
- Task 唯一性檢查 (新增時)
- 必填欄位檢查 (HTML5 `required`)

**行為**:
1. 阻止預設提交行為
2. 收集表單資料
3. 根據類型處理專屬欄位
4. 儲存或更新活動
5. 關閉 Modal
6. 重新渲染

```javascript
document.getElementById('eventForm').addEventListener('submit', function(e) {
  e.preventDefault();
  // ... 處理邏輯
});
```

---

## 使用流程

### 管理者工作流程

#### 1. 建立線上活動並執行抽獎
```
登入管理者
  ↓
點擊「新增活動」
  ↓
選擇類型: Online
  ↓
填寫標題、說明、連結
  ↓
設定抽獎名額: 5
  ↓
儲存活動
  ↓
(等待使用者報名)
  ↓
點擊「執行抽獎」
  ↓
確認抽獎
  ↓
系統隨機選出 5 位中獎者
```

#### 2. 建立實體活動並審核
```
登入管理者
  ↓
點擊「新增活動」
  ↓
選擇類型: OnSite
  ↓
填寫地點、簽到時段
  ↓
儲存活動
  ↓
(等待使用者報名)
  ↓
點擊「報名明細」
  ↓
審核每位報名者
  ↓
點擊「核准」或「拒絕」
```

#### 3. 建立任務累積活動
```
登入管理者
  ↓
點擊「新增活動」
  ↓
選擇類型: Task
  ↓
設定目標次數: 5
  ↓
設定獎勵點數: 100
  ↓
儲存活動
  ↓
系統自動統計使用者進度
```

---

### 使用者工作流程

#### 1. 報名線上活動
```
登入 (輸入 User ID)
  ↓
瀏覽活動列表
  ↓
找到感興趣的 Online 活動
  ↓
點擊「報名參加」
  ↓
自動核准 (無需等待)
  ↓
點擊「查看詳情」
  ↓
查看連結
  ↓
(任務進度 +1)
```

#### 2. 報名實體活動並簽到
```
登入
  ↓
報名 OnSite 活動
  ↓
等待管理者審核
  ↓
(審核通過後)
  ↓
看到「簽到」按鈕
  ↓
前往活動現場
  ↓
點擊「簽到」
  ↓
(任務進度 +1)
```

#### 3. 追蹤任務進度
```
登入後自動顯示任務 Banner
  ↓
查看目前進度條
  ↓
參與更多活動增加次數
  ↓
達成目標後顯示達成標誌
```

---

## 更新與維護

### 版本紀錄

| 版本 | 日期 | 變更內容 |
|------|------|---------|
| 2.4.0 | 2026-01-27 | 必填欄位設定、使用者畫面顯示活動時間 |
| 2.3.0 | 2026-01-27 | Online 活動新增報名時間控制 |
| 2.2.0 | 2026-01-27 | 中獎狀態顯示優化、OMO 概念整合 |
| 2.1.0 | 2026-01-27 | 新增歷史活動區域，任務過期自動隱藏 |
| 2.0.0 | 2026-01-27 | 重大更新：時間區間管理、點數系統、取消報名功能 |
| 1.0.0 | 2026-01-27 | 初始版本發布 |

#### 2.4.0 詳細變更

**必填欄位設定**
- ✅ 活動標題：設為必填
- ✅ 活動說明：設為必填（textarea 加入 required 屬性）
- ✅ Online 活動報名開始時間：設為必填
- ✅ Online 活動報名結束時間：設為必填
- ✅ OnSite 活動報名開始時間：設為必填
- ✅ OnSite 活動報名結束時間：設為必填

**使用者介面優化**
- ✅ 活動卡片顯示報名期間（報名開始時間 ~ 報名結束時間）
- ✅ 進行中活動和歷史活動都顯示時間資訊
- ✅ 時間格式優化：顯示月/日 時:分

**文件更新**
- ✅ 同步更新 README.md、CLAUDE.md、event-system-spec.md
- ✅ 更新必填欄位標記
- ✅ 更新活動類型對比表

#### 2.3.0 詳細變更

**Online 活動時間控制**
- ✅ 新增報名開始時間（registrationStartTime）和報名結束時間（registrationEndTime）
- ✅ 報名邏輯更新：必須在報名時間區間內才能報名
- ✅ 抽獎邏輯更新：必須等待報名結束後才能執行抽獎（移除 drawTime 檢查）
- ✅ 管理者介面更新：顯示報名截止時間、抽獎按鈕提示更新
- ✅ 統一 Online 和 OnSite 的時間控制機制

**文件更新**
- ✅ 同步更新 README.md、CLAUDE.md、event-system-spec.md
- ✅ 更新資料模型和 API 文件

#### 2.2.0 詳細變更

**OMO 概念整合**
- ✅ 全局替換「會議連結」為「連結」，反映 OMO (Online-Merge-Offline) 概念
- ✅ 更新系統概述，加入 OMO 核心概念說明
- ✅ Online 活動連結用途擴展：視訊會議、線上直播、資源連結等

**中獎狀態顯示優化**
- ✅ 歷史活動中顯示 Online 活動的抽獎結果
- ✅ 已中獎：顯示金色「🎉 您已中獎！」標記
- ✅ 未中獎：顯示黃色「💔 未中獎」提示（已參與但未抽中）
- ✅ 未參與或非 Online 活動：不顯示任何中獎相關訊息

**文件更新**
- ✅ 同步更新 README.md、CLAUDE.md、event-system-spec.md
- ✅ 統一術語與概念表述

#### 2.1.0 詳細變更

**使用者介面**
- ✅ 新增「歷史活動」顯示區域
- ✅ 活動自動分類為「進行中」和「歷史」
- ✅ 歷史活動以半透明顯示（opacity: 0.85）
- ✅ 歷史活動只顯示「查看詳情」按鈕

**過期判定邏輯**
- ✅ Online 活動：已執行抽獎（lastDrawTime 存在）→ 歷史活動
- ✅ OnSite 活動：簽到結束或報名結束時間已過 → 歷史活動
- ✅ Task 任務：任務結束時間已過 → 不顯示 Banner

**新增函數**
- ✅ `isEventExpired(event)` - 判斷活動是否過期

#### 2.0.0 詳細變更

**OnSite 活動**
- ✅ 新增報名時間起迄日（registrationStartTime / registrationEndTime）
- ✅ 新增簽到時間起迄日（checkinStartTime / checkinEndTime）
- ✅ 實作取消報名功能（核准前可取消，核准後不可取消）
- ✅ 報名明細顯示核准時間和簽到時間

**Online 活動**
- ✅ 移除報名成功後的「已自動核准」提示
- ✅ 抽獎需等待設定的開始時間才能執行
- ✅ 抽獎按鈕加入 hover 提示（顯示狀態和時間）
- ✅ 每個活動只能執行一次抽獎

**Task 任務系統**
- ✅ 新增任務時間區間（startTime / endTime）
- ✅ 只計算時間區間內的活動參與次數
- ✅ 任務達成後顯示「領取獎勵」按鈕
- ✅ 點數系統實作（累積、領取、顯示）
- ✅ 任務過期後標記並禁止領取

**使用者介面**
- ✅ 頂部顯示累積點數
- ✅ 活動卡片顯示核准時間、簽到時間
- ✅ 活動詳情頁面顯示完整時間資訊
- ✅ 任務進度 Banner 顯示任務期間

**資料模型**
- ✅ Registration 新增 approvedTime 和 checkedInTime
- ✅ Event 新增各類型活動的時間區間欄位
- ✅ 新增 userPoints 和 taskClaims LocalStorage 項目

---

### 待辦事項 (Roadmap)

#### 已完成 (v2.4.0)
- [x] 設定必填欄位（標題、說明、報名時間）
- [x] 使用者畫面顯示活動報名期間

#### 已完成 (v2.3.0)
- [x] Online 活動新增報名時間控制（與 OnSite 統一）
- [x] 抽獎邏輯改為報名結束後執行

#### 已完成 (v2.2.0)
- [x] 歷史活動中獎狀態顯示（已中獎/未中獎提示）
- [x] OMO 概念整合（連結用途擴展）
- [x] 全局術語統一（會議連結 → 連結）

#### 已完成 (v2.1.0)
- [x] 歷史活動顯示區域
- [x] 活動自動分類（進行中/歷史）
- [x] 任務過期自動隱藏

#### 已完成 (v2.0.0)
- [x] OnSite 報名時間區間控制
- [x] OnSite 簽到時間區間控制
- [x] 取消報名功能
- [x] 點數系統
- [x] Task 時間區間管理
- [x] 核准時間與簽到時間記錄

#### 短期目標
- [ ] 新增活動圖片上傳功能
- [ ] 實作報名人數上限控制
- [ ] 新增活動分類/標籤系統
- [ ] 支援匯出報名記錄 (CSV)

#### 中期目標
- [ ] 多語言支援 (英文/日文)
- [ ] 深色模式切換
- [ ] RWD 響應式優化 (手機版)
- [ ] 新增活動搜尋與篩選功能

#### 長期目標
- [ ] 整合後端 API (取代 LocalStorage)
- [ ] Email 通知系統
- [ ] 社群分享功能
- [ ] 數據儀表板與圖表

---

### 已知問題 (Known Issues)

#### 限制
1. **資料隔離**: LocalStorage 無法跨瀏覽器/裝置同步
2. **容量限制**: LocalStorage 約 5-10MB
3. **安全性**: 前端儲存，無加密保護
4. **並發控制**: 無多人同時編輯的衝突處理

#### 解決方案建議
- 短期: 定期匯出資料備份
- 長期: 整合後端資料庫 (Firebase / Supabase)

---

### 調整指南

#### 新增活動類型

1. **定義資料結構**
```javascript
// 在 Event interface 新增屬性
{
  type: "NewType",
  newField1: "value",
  newField2: 123
}
```

2. **更新表單**
```html
<!-- 在 eventModal 新增欄位 -->
<div class="form-group event-field newtype-field hidden">
  <label>新欄位：</label>
  <input type="text" id="newField">
</div>
```

3. **更新欄位控制**
```javascript
function handleEventTypeChange() {
  // 新增類型判斷
  else if (type === 'NewType') {
    document.querySelectorAll('.newtype-field').forEach(field => {
      field.classList.remove('hidden');
    });
  }
}
```

4. **更新統計邏輯**
```javascript
function calculateUserTaskProgress(userId) {
  // 新增統計規則
  if (event.type === 'NewType' && 條件) {
    count++;
  }
}
```

---

#### 修改樣式主題

**色彩替換**:
```css
/* 在 <style> 區塊中搜尋並替換 */
#667eea → 您的主色
#764ba2 → 您的副色
```

**漸層調整**:
```css
/* 背景漸層 */
background: linear-gradient(135deg, 新色1 0%, 新色2 100%);

/* 任務 Banner */
.task-banner {
  background: linear-gradient(135deg, 新色1 0%, 新色2 100%);
}
```

---

#### 新增統計指標

**管理者統計卡片**:
```javascript
function renderAdminScreen() {
  // 新增統計邏輯
  const newMetric = registrations.filter(r => 條件).length;

  // 新增 HTML
  document.getElementById('newMetricId').textContent = newMetric;
}
```

**HTML 結構**:
```html
<div class="stat-item">
  <div class="stat-value" id="newMetricId">0</div>
  <div class="stat-label">新指標名稱</div>
</div>
```

---

#### 匯出/匯入資料

**匯出**:
```javascript
function exportData() {
  const data = {
    events: getEvents(),
    registrations: getRegistrations()
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'event-data-backup.json';
  a.click();
}
```

**匯入**:
```javascript
function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    saveEvents(data.events);
    saveRegistrations(data.registrations);
    renderAdminScreen();
  };
  reader.readAsText(file);
}
```

---

### 效能優化建議

#### 1. 資料索引
當資料量大時，建立索引加速查詢:
```javascript
// 建立 eventId 索引
const regsByEvent = {};
registrations.forEach(reg => {
  if (!regsByEvent[reg.eventId]) regsByEvent[reg.eventId] = [];
  regsByEvent[reg.eventId].push(reg);
});
```

#### 2. 虛擬滾動
活動列表過多時，實作虛擬滾動減少 DOM 節點:
```javascript
// 可使用 Intersection Observer API
```

#### 3. 快取計算結果
任務進度頻繁計算時:
```javascript
const progressCache = {};
function calculateUserTaskProgress(userId) {
  if (progressCache[userId]) return progressCache[userId];
  // ... 計算邏輯
  progressCache[userId] = count;
  return count;
}
```

---

### 安全性注意事項

#### XSS 防護
所有使用者輸入應進行 HTML 跳脫:
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

#### 資料驗證
前端驗證不可信賴，建議整合後端時:
```javascript
// 後端驗證範例
if (!isValidUserId(userId)) {
  return { error: 'Invalid User ID' };
}
```

---

### 測試建議

#### 單元測試 (Unit Test)
```javascript
// 測試任務統計邏輯
test('calculateUserTaskProgress', () => {
  // Arrange
  const userId = 'testUser';
  // Act
  const result = calculateUserTaskProgress(userId);
  // Assert
  expect(result).toBe(3);
});
```

#### 整合測試 (Integration Test)
```javascript
// 測試報名流程
test('user registration flow', () => {
  loginAsUser('testUser');
  registerEvent('evt_123');
  const regs = getRegistrations();
  expect(regs.length).toBe(1);
  expect(regs[0].status).toBe('approved');
});
```

#### 手動測試檢查清單
- [ ] 管理者可新增三種類型活動
- [ ] Task 類型唯一性限制生效
- [ ] Online 活動報名自動核准
- [ ] OnSite 活動需審核後才能簽到
- [ ] 抽獎功能正常運作
- [ ] 任務進度條正確計算
- [ ] 達成任務後顯示標誌
- [ ] 中獎名單正確遮罩
- [ ] 清除資料功能正常
- [ ] 多使用者資料隔離

---

### 聯絡資訊

**專案負責人**: [您的名字]
**Email**: [您的信箱]
**最後更新**: 2026-01-27

---

## 附錄

### A. 快速參考表

#### 活動類型對照表
| 類型 | 報名方式 | 統計條件 | 特殊功能 |
|------|---------|---------|---------|
| Online | 自動核准 | `status === "approved"` | 抽獎 |
| OnSite | 需審核 | `status === "approved" && checkedIn` | 簽到 |
| Task | 不可報名 | 系統自動統計 | 進度追蹤 |

#### 狀態對照表
| 狀態 | 英文 | 顏色 | 說明 |
|------|------|------|------|
| 待審核 | pending | 黃色 | 等待管理者處理 |
| 已核准 | approved | 綠色 | 可參與活動 |
| 已拒絕 | rejected | 紅色 | 報名未通過 |

---

### B. LocalStorage 結構範例

```json
{
  "events": [
    {
      "id": "evt_1738012345678",
      "type": "Online",
      "title": "前端技術分享會",
      "description": "探討最新前端趨勢",
      "link": "https://meet.example.com/abc",
      "drawSlots": 5,
      "drawTime": "2026-01-27T15:30:00.000Z"
    },
    {
      "id": "evt_1738012345679",
      "type": "OnSite",
      "title": "實體工作坊",
      "description": "手把手教學",
      "location": "台北市信義區",
      "checkinTime": "2026-02-01T14:00"
    },
    {
      "id": "evt_1738012345680",
      "type": "Task",
      "title": "活動達人",
      "description": "參加 5 場活動",
      "taskGoal": 5,
      "taskPoints": 100
    }
  ],
  "registrations": [
    {
      "eventId": "evt_1738012345678",
      "userName": "user001",
      "timestamp": "2026-01-27T10:00:00.000Z",
      "status": "approved",
      "checkedIn": false,
      "isWinner": true
    },
    {
      "eventId": "evt_1738012345679",
      "userName": "user001",
      "timestamp": "2026-01-27T10:05:00.000Z",
      "status": "approved",
      "checkedIn": true,
      "isWinner": false
    }
  ]
}
```

---

### C. CSS Class 速查

#### 按鈕類別
- `.btn` - 基礎按鈕
- `.btn-primary` - 主要動作 (藍紫)
- `.btn-success` - 成功/核准 (綠)
- `.btn-danger` - 危險/刪除 (紅)
- `.btn-warning` - 警告/抽獎 (橘)
- `.btn-secondary` - 次要動作 (灰)
- `.btn-claim` - 領取獎勵按鈕 (金色漸層)
- `.btn:disabled` - 禁用狀態按鈕

#### 狀態標籤
- `.status-badge` - 基礎標籤
- `.status-pending` - 待審核 (黃)
- `.status-approved` - 已核准 (綠)
- `.status-rejected` - 已拒絕 (紅)

#### 類型標籤
- `.card-badge` - 基礎徽章
- `.badge-online` - 線上活動 (藍)
- `.badge-onsite` - 實體活動 (綠)
- `.badge-task` - 任務累積 (橘)

#### 工具類別
- `.hidden` - 隱藏元素
- `.info-text` - 資訊提示框 (藍綠)
- `.warning-text` - 警告提示框 (黃)
- `.points-display` - 點數顯示 (金色漸層)
- `.tooltip` / `.tooltiptext` - 提示框容器與內容
- `.achievement-stamp` - 達成標記 (脈衝動畫)
- `.status-waitlist` - 候補狀態標籤 (v3.0.0)

---

## 版本歷史

### v3.0.0 (2026-01-27)
**重大功能更新**：
- ✨ UI 全面優化
  - 漸層背景和覆蓋層效果
  - 玻璃擬態 (Glassmorphism) 登入畫面
  - 增強的按鈕、卡片、模態框樣式
  - 滑入、淡入、閃爍等動畫效果
  - 優化的表單輸入框和狀態標籤
- 🎟️ 報名人數上限與候補機制
  - Online/OnSite 活動可設定 `maxParticipants`
  - Online 達上限後拒絕報名
  - OnSite 達上限後自動進入候補名單
  - 候補狀態 (`waitlist`) 與順位管理
  - 自動遞補邏輯 (`promoteFromWaitlist`)
  - 手動遞補功能 (`promoteWaitlistUser`)
- 🔐 OnSite 動態簽到碼系統
  - 6 位字母數字組合簽到碼
  - 每 30 秒自動刷新
  - QR Code 掃描支援 (qrcode.js v1.5.3)
  - 管理者界面實時顯示倒數計時
  - 簽到碼有效期驗證

### v2.4.0 (2026-01-27)
- 活動標題、描述、報名時間設為必填欄位
- 使用者界面顯示報名開始/結束時間
- 動態表單驗證（根據活動類型添加/移除 required 屬性）

### v2.3.0 (2026-01-27)
- Online 活動新增報名開始/結束時間控制
- 抽獎改為報名結束後才能執行

### v2.2.0 (2026-01-27)
- 歷史活動顯示未中獎提示
- OMO 概念說明
- 活動分類顯示（進行中/歷史）

### v2.1.0 (2026-01-27)
- 新增歷史活動區域
- 任務過期後自動隱藏 Banner

### v2.0.0 (2026-01-27)
- 時間區間管理功能
- 點數系統與獎勵領取
- OnSite 取消報名功能

### v1.0.0 (2026-01-27)
- 初始版本發布

---

**文件結束**
