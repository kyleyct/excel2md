#!/bin/bash
# start-demo.sh — W4 Excel → Markdown 本地啟動腳本
# 用法: ./start-demo.sh
# 開瀏覽器: http://localhost:8080/

set -e
PORT=${1:-8080}
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  W4 Excel → Markdown — 本地 Demo"
echo "=========================================="
echo ""
echo "啟動目錄: $DIR"
echo "本機 URL : http://localhost:$PORT/"
echo ""
echo "操作步驟:"
echo "  1. 拖拽 .xlsx / .xls / .csv 檔案到上傳區"
echo "  2. 即時睇到 markdown 預覽"
echo "  3. 點 '📋 複製' 或 '⬇ 下載' 拎走 markdown"
echo ""
echo "註: 全部檔案喺你個瀏覽器內處理, 唔上傳任何伺服器"
echo ""
echo "按 Ctrl+C 停止"
echo ""

cd "$DIR"
python3 -m http.server "$PORT"
