#!/usr/bin/env bash
# macOS: Finder에서 이 파일을 더블클릭하면 서버가 뜨고 브라우저가 열립니다.
# (index.html 을 직접 더블클릭하면 브라우저 보안 정책상 동작하지 않습니다)
cd "$(dirname "$0")"
exec ./serve.sh
