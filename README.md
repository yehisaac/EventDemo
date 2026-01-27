# 活動報名與任務累積系統 - AI 開發規格

> 本文件提供給 AI 助手使用，用於重建或開發類似功能的活動管理系統

---

## 系統概述

開發一個整合「活動報名管理」與「里程碑任務累積」的單頁應用系統。

**核心概念**：
- 支援 **OMO (Online-Merge-Offline)** 活動模式
- Online 活動：線上參與，可提供連結（視訊會議、線上直播、資源連結等）
- OnSite 活動：實體現場參與，需簽到驗證
- 兩種模式可靈活組合，實現線上線下融合的活動體驗

**技術要求**：
- 單一 HTML 檔案（包含 CSS 和 JavaScript）
- 使用 LocalStorage 儲存資料
- 純前端實作，無需後端
- 支援一鍵清除所有資料

---

## 角色定義

### 管理者 (Admin)
- 直接點擊登入，無需密碼
- 可新增、編輯、刪除所有類型活動
- 可審核 OnSite 活動報名（核准/拒絕）
- 可執行 Online 活動抽獎
- 可查看所有報名明細與統計數據

### 使用者 (User)
- 輸入自定義 User ID 登入
- 可報名 Online 和 OnSite 活動
- 可查看個人任務進度和累積點數
- 可在符合條件時簽到和領取獎勵
- 資料隔離：只能看到自己的報名狀態
- 可查看歷史活動（已結束的活動）

---

## 活動類型規格

### 1. Online (線上活動)

**定義**：線上參與的活動形式，可提供各種線上資源連結。

**資料欄位**：
- 基本：標題、說明
- 專屬：連結（視訊會議/直播/資源等）、報名開始/結束時間、抽獎名額

**連結用途範例**：
- 視訊會議連結（Zoom、Google Meet、Teams）
- 線上直播網址（YouTube、Facebook Live）
- 活動資源連結（簡報、錄影、文件）
- 線上報到表單連結

**報名規則**：
- 必須在報名時間區間內才能報名
- 點擊報名後自動核准（不顯示「已核准」提示）
- 無需管理者審核

**抽獎規則**：
- 必須等到報名結束後才能執行抽獎
- 從已核准的參與者中隨機抽選指定名額
- 每個活動只能執行一次抽獎
- 抽獎按鈕需顯示 hover 提示（報名尚未結束/已執行/可執行）

**任務統計**：
- 條件：`status === "approved"`
- 時間點：使用核准時間 (`approvedTime`)

---

### 2. OnSite (實體活動)

**資料欄位**：
- 基本：標題、說明
- 專屬：活動地點、報名開始/結束時間、簽到開始/結束時間

**報名規則**：
- 必須在報名時間區間內才能報名
- 報名後狀態為「待審核」(`pending`)
- **核准前可以取消報名**
- **核准後不可取消報名**
- 管理者審核後記錄核准時間

**簽到規則**：
- 必須先通過審核
- 必須在簽到時間區間內才能簽到
- 簽到時記錄簽到時間

**任務統計**：
- 條件：`status === "approved" && checkedIn === true`
- 時間點：使用簽到時間 (`checkedInTime`)

---

### 3. Task (任務累積)

**資料欄位**：
- 基本：標題、說明
- 專屬：任務開始/結束時間、目標參加次數、獎勵點數

**限制條件**：
- 系統中同時只能存在一個 Task 活動
- 使用者無法主動報名，系統自動統計

**統計邏輯**：
```
計算使用者在任務時間區間內的活動參與次數：
- Online 活動：status === "approved" 且 approvedTime 在區間內 → +1
- OnSite 活動：status === "approved" && checkedIn === true 且 checkedInTime 在區間內 → +1
```

**獎勵機制**：
- 當累積次數 >= 目標次數時，顯示「領取獎勵」按鈕
- 點擊按鈕後獲得點數，累加到使用者帳戶
- 每個任務每位使用者只能領取一次
- 任務過期後無法領取獎勵

**UI 呈現**：
- 在使用者介面頂部顯示醒目的 Banner
- 顯示進度條（當前次數 / 目標次數）
- 顯示任務期間和獎勵點數
- 達成後顯示達成標誌和領取按鈕

---

## 資料結構

### Event (活動)
```javascript
{
  id: "evt_timestamp",  // 唯一識別碼
  type: "Online" | "OnSite" | "Task",
  title: string,
  description: string,

  // Online 專屬
  link?: string,                  // 連結
  registrationStartTime?: string, // 報名開始時間
  registrationEndTime?: string,   // 報名結束時間
  drawSlots?: number,             // 抽獎名額
  lastDrawTime?: string,          // 抽獎執行時間戳記

  // OnSite 專屬
  location?: string,              // 活動地點
  registrationStartTime?: string, // 報名開始時間
  registrationEndTime?: string,   // 報名結束時間
  checkinStartTime?: string,      // 簽到開始時間
  checkinEndTime?: string,        // 簽到結束時間

  // Task 專屬
  startTime?: string,             // 任務開始時間
  endTime?: string,               // 任務結束時間
  taskGoal?: number,              // 目標次數
  taskPoints?: number             // 獎勵點數
}
```

### Registration (報名記錄)
```javascript
{
  eventId: string,              // 對應活動 ID
  userName: string,             // 使用者 ID
  timestamp: string,            // 報名時間 (ISO 8601)
  status: "pending" | "approved" | "rejected",
  approvedTime?: string,        // 核准時間
  checkedIn: boolean,           // 是否已簽到
  checkedInTime?: string,       // 簽到時間
  isWinner: boolean             // 是否中獎
}
```

### LocalStorage 結構
```javascript
{
  events: Event[],              // 活動列表
  registrations: Registration[], // 報名記錄
  userPoints: {                 // 使用者點數
    [userId]: number
  },
  taskClaims: {                 // 任務領取記錄
    [userId]: {
      [taskId]: boolean
    }
  }
}
```

---

## 核心功能需求

### 1. 活動管理（管理者）

**新增/編輯活動**：
- 表單欄位根據活動類型動態顯示/隱藏
- Task 類型需檢查唯一性（新增時）
- 時間欄位使用 `datetime-local` 輸入

**刪除活動**：
- 需使用者確認
- 同時刪除相關的所有報名記錄

**報名明細**：
- 顯示所有報名者的資訊
- 顯示報名時間、核准時間（OnSite）、簽到時間（OnSite）
- OnSite 活動顯示核准/拒絕按鈕（僅待審核狀態）

**執行抽獎**：
- 檢查抽獎開始時間是否到期
- 檢查是否已執行過
- 隨機抽選符合資格的參與者
- 按鈕 hover 顯示狀態提示

### 2. 使用者功能

**報名活動**：
- Online：立即核准，記錄 `approvedTime`
- OnSite：檢查報名時間區間，設為 `pending` 狀態
- 檢查是否已報名（防止重複）

**取消報名**（OnSite）：
- 僅在 `status === "pending"` 時顯示取消按鈕
- 確認後從 registrations 中移除該記錄

**簽到**（OnSite）：
- 檢查 `status === "approved"`
- 檢查是否在簽到時間區間內
- 設定 `checkedIn = true` 並記錄 `checkedInTime`

**查看活動詳情**：
- 顯示活動基本資訊
- Online：核准後才顯示連結
- OnSite：顯示報名時間、簽到時間區間
- 顯示中獎名單（遮罩處理：首尾字元 + 4個星號）
- 顯示個人的報名時間、核准時間、簽到時間

**任務進度**：
- 計算時間區間內的參與次數
- 顯示進度條和百分比
- 達成後顯示達成標誌
- 任務期間內可領取獎勵

**領取獎勵**：
- 檢查是否已領取（防止重複）
- 增加使用者點數
- 記錄領取狀態

### 3. 時間控制邏輯

**報名時間檢查**（OnSite）：
```javascript
now >= registrationStartTime && now <= registrationEndTime
```

**簽到時間檢查**（OnSite）：
```javascript
now >= checkinStartTime && now <= checkinEndTime
```

**抽獎時間檢查**（Online）：
```javascript
now >= registrationEndTime && !lastDrawTime
// 報名結束後才可以抽獎
```

**任務區間檢查**（Task）：
```javascript
activityTime >= taskStartTime && activityTime <= taskEndTime
```

---

## UI/UX 要點

### 配色建議
- 主色調：紫色漸層 (#667eea → #764ba2)
- 任務 Banner：粉紅漸層 (#f093fb → #f5576c)
- 點數顯示：金色漸層 (#ffd700 → #ffed4e)

### 元件設計

**活動卡片**：
- 顯示活動標題、類型標籤、說明
- 顯示中獎標記（如適用）
- 顯示報名狀態和時間資訊
- 動態顯示操作按鈕（報名/取消/簽到/詳情）

**任務 Banner**：
- 醒目的漸層背景，置於頁面頂部
- 進度條動畫效果
- 達成後顯示脈衝動畫的達成標誌
- 顯示任務期間、目前進度、獎勵點數
- **任務過期後自動隱藏，不再顯示**

**活動分類顯示**：
- 進行中的活動：正常顯示，可互動
- 歷史活動：半透明顯示（opacity: 0.85）
- 歷史活動標記「活動已結束」
- 歷史活動只顯示「查看詳情」按鈕

**中獎狀態顯示**（Online 活動歷史）：
- 已中獎：顯示金色「🎉 您已中獎！」標記
- 未中獎：顯示黃色「💔 未中獎」提示（已參與但未抽中）
- 未參與：不顯示任何中獎相關訊息

**過期判定規則**：
- Online 活動：已執行抽獎（lastDrawTime 存在）
- OnSite 活動：簽到結束時間已過或報名結束時間已過
- Task 任務：任務結束時間已過（過期後不顯示 Banner）

**按鈕狀態**：
- 主要動作：藍紫色
- 成功/核准：綠色
- 危險/刪除：紅色
- 禁用：灰色 + 降低不透明度
- Hover 效果：向上移動 2-5px

**Tooltip 提示**：
- 抽獎按鈕 hover 時顯示狀態
- 顯示時間資訊或限制說明

### 響應式行為
- 使用 Grid 佈局顯示活動卡片
- 卡片最小寬度 320px
- Hover 時卡片輕微上浮
- 按鈕使用 flex 排列，自動換行

---

## 關鍵實作細節

### 1. 資料隔離
- 使用者只能看到自己的報名記錄
- 使用 `userName === currentUser` 過濾資料
- 中獎名單顯示時進行 ID 遮罩

### 2. 狀態管理
```javascript
let currentUser = null;   // 當前登入的使用者 ID
let currentRole = null;   // "admin" | "user"
```

### 3. 時間格式
- 輸入：`datetime-local` 格式 (YYYY-MM-DDTHH:mm)
- 儲存：ISO 8601 格式 (new Date().toISOString())
- 顯示：本地化格式 (toLocaleString('zh-TW'))

### 4. ID 生成
```javascript
eventId: 'evt_' + Date.now()
```

### 5. 隨機抽獎
```javascript
eligibleRegs.sort(() => 0.5 - Math.random()).slice(0, winnerCount)
```

### 6. 進度計算
```javascript
percentage = Math.min(100, (currentCount / goalCount) * 100)
```

---

## 使用流程範例

### 管理者建立完整活動流程
1. 登入管理者帳號
2. 新增 Online 活動（設定抽獎時間）
3. 新增 OnSite 活動（設定報名和簽到時間區間）
4. 新增 Task 任務（設定任務期間和目標）
5. 審核 OnSite 報名
6. 時間到期後執行 Online 抽獎

### 使用者參與完整流程
1. 輸入 User ID 登入
2. 報名 Online 活動（自動核准）
3. 報名 OnSite 活動（等待審核）
4. 核准後在時間內簽到
5. 查看任務進度自動累積
6. 達成任務後領取點數
7. 查看活動詳情和中獎名單

---

## 驗證檢查清單

實作完成後，請驗證以下功能：

**基礎功能**：
- [ ] 管理者和使用者登入切換正常
- [ ] 三種活動類型都能正確新增和顯示
- [ ] 清除資料功能正常

**Online 活動**：
- [ ] 報名後自動核准且不顯示提示
- [ ] 抽獎時間未到時按鈕禁用
- [ ] Hover 按鈕顯示正確提示
- [ ] 抽獎只能執行一次
- [ ] 連結僅核准後可見

**OnSite 活動**：
- [ ] 報名時間區間檢查正常
- [ ] 核准前可取消報名
- [ ] 核准後不顯示取消按鈕
- [ ] 簽到時間區間檢查正常
- [ ] 核准時間和簽到時間正確記錄
- [ ] 報名明細顯示完整時間資訊

**Task 任務**：
- [ ] 系統只能存在一個任務
- [ ] 進度只計算時間區間內的活動
- [ ] 進度條正確顯示
- [ ] 達成後顯示領取按鈕
- [ ] 領取後點數正確增加
- [ ] 每個任務只能領取一次
- [ ] 任務過期後標記正確

**使用者介面**：
- [ ] 點數顯示在頂部
- [ ] 核准時間和簽到時間正確顯示
- [ ] 活動詳情頁面資訊完整
- [ ] 中獎名單正確遮罩

**資料持久化**：
- [ ] LocalStorage 正確儲存和讀取
- [ ] 重新整理頁面資料不丟失

---

## 常見問題

**Q: 如何處理時區問題？**
A: datetime-local 輸入會使用本地時區，儲存時轉為 UTC (ISO 8601)，顯示時轉回本地時間。

**Q: 任務進度計算的時間點是什麼？**
A: Online 使用 `approvedTime`，OnSite 使用 `checkedInTime`。

**Q: 為什麼 Online 報名不顯示「已核准」？**
A: 根據 v2.0.0 需求，為了簡化使用者體驗，Online 活動報名成功只顯示「報名成功」。

**Q: 取消報名的條件是什麼？**
A: 只有 OnSite 活動且 `status === "pending"` 時可以取消。

**Q: 抽獎按鈕的三種狀態是什麼？**
A:
1. 尚未到期：禁用 + 顯示到期時間
2. 已執行：禁用 + 顯示「抽獎已執行」
3. 可執行：啟用 + 顯示「可執行抽獎」

---

## 擴展建議

如需擴展系統功能，可考慮：

1. **報名人數限制**：為活動設定報名上限
2. **活動圖片**：支援上傳活動封面圖
3. **分類標籤**：為活動新增分類和標籤
4. **匯出功能**：匯出報名記錄為 CSV
5. **通知系統**：審核通過或中獎時的通知
6. **點數商店**：使用點數兌換獎勵
7. **多任務支援**：同時進行多個不同類型的任務
8. **後端整合**：替換 LocalStorage 為真實資料庫

---

**版本**: 2.2.0
**最後更新**: 2026-01-27
**變更記錄**:
- v2.2.0: 未中獎提示、連結改名、OMO 概念說明
- v2.1.0: 新增歷史活動區域，任務過期後自動隱藏
- v2.0.0: 時間區間管理、點數系統、取消報名功能
- v1.0.0: 初始版本

**授權**: MIT
