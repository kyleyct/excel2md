# 安裝細節

## 系統要求

- 任何有瀏覽器嘅 OS (Windows / macOS / Linux / ChromeOS)
- Python 3.x (僅用於本地啟動 server,系統已內置大部份)
- 或任何 static file server (例如 `npx serve`, `php -S`, `ruby -run -e httpd`)

## macOS / Linux

```bash
# 1. Clone repo
git clone https://github.com/kyleyct/w4-excel2md.git
cd w4-excel2md

# 2. 啟動 script 設定可執行權限
chmod +x start-demo.sh

# 3. 啟動 server (預設 port 8080)
./start-demo.sh

# 或自訂 port
./start-demo.sh 3000
```

開 http://localhost:8080/

### Python 唔啱用?

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
git clone https://github.com/kyleyct/w4-excel2md.git
cd w4-excel2md

REM 2. 雙擊 start-demo.bat,或 cmd 執行
start-demo.bat
```

開 http://localhost:8080/

### Python 唔啱用?

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
4. **Network tab 只見到 .html / .css / .js 資源載入,完全唔見 POST/PUT/PATCH 任何檔案**

技術上,Demo 用嘅 `window.XLSX.read(file)` 喺瀏覽器執行,完全本地,連 localhost server 都唔知你嘅檔案內容。

## 常見問題

### Q: 為何唔用 file:// 直接開 index.html?

A: 瀏覽器 CORS 政策禁止 file:// 讀取本地檔案,要用 http server。

### Q: 點解唔直接放 GitHub Pages?

A: 已經有 — https://kyleyct.github.io/w4-excel2md/。但本地 demo 完全離線,適合處理高度敏感檔案。

### Q: Excel 公式 (例如 =SUM(A1:A10)) 點處理?

A: SheetJS 預設讀取計算後嘅值。要睇原始公式,可以喺 parser.js 用 `cell.f` 取 formula。

### Q: 支援 .xls (舊版)?

A: 支援。SheetJS 自動偵測 OOXML (.xlsx) vs BIFF (.xls)。

### Q: 支援 Google Sheets 匯出?

A: 喺 Google Sheets 揾 `檔案 → 下載 → Microsoft Excel (.xlsx)`,然後用本工具轉。

### Q: 點解毋須 build step?

A: 純 vanilla JS + SheetJS vendor,ES2020 瀏覽器原生支援,毋須 bundler。

## 更新

```bash
cd w4-excel2md
git pull origin main
```

## 卸載

```bash
rm -rf w4-excel2md   # macOS / Linux
rmdir /s /q w4-excel2md   # Windows
```

完全本地工具,毋須登出、取消訂閱、清除雲端資料。
