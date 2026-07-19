@echo off
REM 로컬 정적 서버 실행 + 브라우저 열기 (Windows)
REM 사용법:  serve.bat   또는   serve.bat 9000
setlocal
cd /d "%~dp0"
set "PORT=%~1"
if "%PORT%"=="" set "PORT=8123"
set "URL=http://127.0.0.1:%PORT%"

echo Running server: %URL%   (stop: Ctrl+C)
start "" "%URL%"

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python -m http.server %PORT%
  goto :eof
)
where npx >nul 2>&1
if %ERRORLEVEL%==0 (
  npx --yes serve -l %PORT% .
  goto :eof
)
echo python or Node ^(npx^) is required.
exit /b 1
