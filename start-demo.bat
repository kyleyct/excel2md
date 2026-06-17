@echo off
REM start-demo.bat — W4 Excel → Markdown Windows 啟動腳本
REM 用法: 雙擊執行
REM 開瀏覽器: http://localhost:8080/

set PORT=8080
set DIR=%~dp0

echo ==========================================
echo   W4 Excel ^-^> Markdown - 本地 Demo
echo ==========================================
echo.
echo 啟動目錄: %DIR%
echo 本機 URL : http://localhost:%PORT%/
echo.
echo 操作步驟:
echo   1. 拖拽 .xlsx / .xls / .csv 檔案到上傳區
echo   2. 即時睇到 markdown 預覽
echo   3. 點 複製 或 下載 拎走 markdown
echo.
echo 註: 全部檔案喺你個瀏覽器內處理, 唔上傳任何伺服器
echo.
echo 按 Ctrl+C 停止
echo.

cd /d "%DIR%"
python -m http.server %PORT%
