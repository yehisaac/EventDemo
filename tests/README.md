# 測試指南

## 測試架構

本專案使用 [Jest](https://jestjs.io/) 測試框架進行單元測試。

### 測試覆蓋範圍

- ✅ **utils.test.js** - 工具函數測試
  - maskUserId (使用者 ID 遮罩)
  - isEventExpired (活動過期判斷)
  - isInTimeRange (時間區間檢查)

- ✅ **storage.test.js** - LocalStorage 操作測試
  - Events CRUD
  - Registrations CRUD
  - User Points 管理
  - Task Claims 管理
  - Hybrid 模式資料結構

- ✅ **waitlist.test.js** - 候補名單測試
  - getApprovedCount (核准人數計算)
  - promoteFromWaitlist (自動遞補)
  - 候補順位更新

- ✅ **checkin.test.js** - 簽到碼系統測試
  - generateCheckinCode (生成簽到碼)
  - isCheckinCodeValid (驗證有效期)
  - validateCheckinCode (驗證輸入碼)

- ✅ **task.test.js** - 任務系統測試
  - calculateUserTaskProgress (計算任務進度)
  - claimTaskReward (領取獎勵)
  - Hybrid 模式任務統計邏輯

## 安裝依賴

```bash
npm install
```

## 執行測試

### 執行所有測試
```bash
npm test
```

### 監聽模式（開發時使用）
```bash
npm run test:watch
```

### 生成測試覆蓋率報告
```bash
npm run test:coverage
```

測試覆蓋率報告會生成在 `coverage/` 資料夾中，可以開啟 `coverage/lcov-report/index.html` 查看詳細報告。

## 測試結構

```
tests/
├── README.md           # 本文件
├── utils.test.js       # 工具函數測試
├── storage.test.js     # 儲存層測試
├── waitlist.test.js    # 候補邏輯測試
├── checkin.test.js     # 簽到碼測試
└── task.test.js        # 任務系統測試（含 Hybrid 模式）
```

## 測試重點

### Hybrid 混合模式測試

在 `task.test.js` 中，特別測試了 v3.2.0 新增的 Hybrid 混合模式功能：

1. **線上參與者任務計算**
   - 當 `countOnlineForTask = true` 時計入任務統計
   - 當 `countOnlineForTask = false` 時不計入

2. **實體參與者任務計算**
   - 必須簽到才計入任務統計
   - 不受 `countOnlineForTask` 設定影響

3. **混合場景測試**
   - 同一活動同時有線上和實體參與者
   - 正確區分不同參與方式的統計邏輯

### LocalStorage Mock

所有測試使用 LocalStorage Mock，不會影響瀏覽器的實際資料：

```javascript
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() { this.store = {}; }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
}
```

## 測試最佳實踐

1. **獨立性**: 每個測試案例應該獨立運行，使用 `beforeEach` 清理狀態
2. **命名**: 使用描述性的測試名稱，清楚說明測試目的
3. **覆蓋率**: 測試正常情況、邊界情況和錯誤情況
4. **可讀性**: 測試程式碼應該容易理解，作為功能的文檔

## 持續整合 (CI)

測試可以整合到 CI/CD 流程中：

```yaml
# GitHub Actions 範例
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## 疑難排解

### 問題：測試無法執行

**解決方案**:
```bash
# 清理並重新安裝依賴
rm -rf node_modules package-lock.json
npm install
```

### 問題：ES Module 錯誤

**解決方案**: 確保 `package.json` 中有 `"type": "module"` 設定。

### 問題：測試超時

**解決方案**: 在 `jest.config.js` 中增加 `testTimeout` 設定：
```javascript
export default {
  testTimeout: 10000  // 10 秒
};
```

## 參考資源

- [Jest 官方文檔](https://jestjs.io/docs/getting-started)
- [Jest DOM 測試](https://testing-library.com/docs/ecosystem-jest-dom/)
- [測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)
