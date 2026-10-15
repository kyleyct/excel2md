# 安裝細節

## 系統要求

- 任何有瀏覽器的 OS（Windows / macOS / Linux / ChromeOS）
- Python 3.x (僅用於本地啟動 server,系統已內置大部份)
- 或任何 static file server (例如 `npx serve`, `php -S`, `ruby -run -e httpd`)

## macOS / Linux

```bash
# 1. Clone repo
git clone https://github.com/kyleyct/excel2md.git
cd excel2md

# 2. 啟動 script 設定可執行權限
chmod +x start-demo.sh

# 3. 啟動 server (預設 port 8080)
./start-demo.sh

# 或自訂 port
./start-demo.sh 3000
```

開 http://localhost:8080/

### Python 不合用？

```bash
# Node.js 用戶
npx serve -p 8080

# Ruby 用戶
ruby -run -e httpd . -p 8080

# PHP 用戶
php -S localhost:8080
```

## Windows

```cmd
REM 1. Clone repo
git clone https://github.com/kyleyct/excel2md.git
cd excel2md

REM 2. 雙擊 start-demo.bat,或 cmd 執行
start-demo.bat
```

開 http://localhost:8080/

### Python 不合用？

```powershell
# Node.js 用戶
npx serve -p 8080

# PowerShell 內建
python -m http.server 8080
```

## 私隱驗證

如果你想 audit 工具真係零上傳:

1. 開瀏覽器 DevTools (F12)
2. 切去 `Network` tab
3. 拖個 .xlsx 檔入上傳區
4. **Network tab 只見到 .html / .css / .js 資源載入，完全不見 POST/PUT/PATCH 任何檔案**

技術上，Demo 用的 `window.XLSX.read(file)` 在瀏覽器執行，完全本地，連 localhost server 都不知道你的檔案內容。

## 常見問題

### Q: 為何不用 file:// 直接開啟 index.html？

A: 瀏覽器 CORS 政策禁止 file:// 讀取本地檔案,要用 http server。

### Q: 為何不直接放在 GitHub Pages？

A: 已經有 — https://kyleyct.github.io/excel2md/。但本地 demo 完全離線,適合處理高度敏感檔案。

### Q: Excel 公式 (例如 =SUM(A1:A10)) 點處理?

A: SheetJS 預設讀取計算後的值。要看原始公式，可以在 parser.js 用 `cell.f` 取 formula。

### Q: 支援 .xls (舊版)?

A: 支援。SheetJS 自動偵測 OOXML (.xlsx) vs BIFF (.xls)。

### Q: 支援 Google Sheets 匯出?

A: 在 Google Sheets 選 `檔案 → 下載 → Microsoft Excel (.xlsx)`，然後用本工具轉換。

### Q: 為何毋須 build step？

A: 純 vanilla JS + SheetJS vendor,ES2020 瀏覽器原生支援,毋須 bundler。

## 更新

```bash
cd excel2md
git pull origin main
```

## 卸載

```bash
rm -rf excel2md   # macOS / Linux
rmdir /s /q excel2md   # Windows
```

完全本地工具,毋須登出、取消訂閱、清除雲端資料。
