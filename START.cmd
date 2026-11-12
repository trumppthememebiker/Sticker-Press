@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 20 or newer from https://nodejs.org
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4192 in Chrome or Edge.
echo Press Ctrl+C to stop Sticker Press.
node server.mjs
pause
