#!/bin/bash
cd "$(dirname "$0")"
echo "モンとも を起動しています..."
echo "このウィンドウは閉じずに、そのままにしておいてください。"
echo "ブラウザで http://localhost:3461 を開いてください。"
echo ""
python3 serve.py
