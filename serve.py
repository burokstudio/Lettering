#!/usr/bin/env python3
# 로컬 개발 서버: 캐시 금지(no-store) + ES 모듈/폰트 MIME 보장.
# (브라우저 stale 캐시로 "화면만 뜨고 기능 안 됨" 되는 문제 예방)
import sys, http.server, socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.css': 'text/css',
        '.woff2': 'font/woff2',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
    }
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def log_message(self, fmt, *args):
        sys.stderr.write("  " + (fmt % args) + "\n")

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
    print(f'▶ http://127.0.0.1:{PORT}  (Ctrl+C 종료)')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
