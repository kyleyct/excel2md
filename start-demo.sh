#!/bin/bash
# start-demo.sh — Excel → Markdown 本地啟動腳本
# 用法: ./start-demo.sh
# 開瀏覽器: http://localhost:8080/

set -e
PORT=${1:-8080}
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  Excel → Markdown — 本地 Demo"
echo "=========================================="
echo ""
echo "啟動目錄: $DIR"
echo "本機 URL : http://localhost:$PORT/"
echo ""
echo "操作步驟:"
echo "  1. 拖拽 .xlsx / .xls / .csv 檔案到上傳區"
echo "  2. 即時看到 markdown 預覽"
echo "  3. 按 '📋 複製' 或 '⬇ 下載' 取得 markdown"
echo ""
echo "註: 全部檔案在你的瀏覽器內處理，不上傳任何伺服器"
echo ""
echo "按 Ctrl+C 停止"
echo ""

cd "$DIR"
python3 -m http.server "$PORT"
