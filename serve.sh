#!/usr/bin/env bash
# 로컬 정적 서버 실행 + 브라우저 열기 (macOS / Linux)
# 사용법:  ./serve.sh   또는   ./serve.sh 9000
set -e
cd "$(dirname "$0")"
PORT="${1:-8123}"
URL="http://127.0.0.1:${PORT}"

# 서버가 뜬 뒤 브라우저 자동 오픈
( sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"          # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" # Linux
  fi
) &

echo "▶ 레터링 서버: ${URL}  (종료: Ctrl+C)"
# 캐시 금지 서버(serve.py) 우선 → 일반 http.server → npx serve 폴백
if command -v python3 >/dev/null 2>&1; then
  if [ -f serve.py ]; then python3 serve.py "$PORT"; else python3 -m http.server "$PORT"; fi
elif command -v npx >/dev/null 2>&1; then
  npx --yes serve -l "$PORT" .
else
  echo "python3 또는 Node(npx)가 필요합니다." >&2
  exit 1
fi
