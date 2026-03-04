@echo off
chcp 65001 >nul
title Portal Launcher

set "CLIENT_DIR=%~dp0client"
set "SERVER_DIR=%~dp0server"
set "CLIENT_PORT=3000"
set "SERVER_PORT=3001"

:menu
cls
echo.
echo  ╔═══════════════════════════════════════════════╗
echo  ║           🚀 PORTAL LAUNCHER                  ║
echo  ╚═══════════════════════════════════════════════╝
echo.
echo  Chon thao tac:
echo.
echo  [1] ▶  Start Client + Server
echo  [2] 🔄 Restart Client
echo  [3] 🔄 Restart Server
echo  [4] 🌐 Open Localhost in Browser
echo  [5] ⏹️  Stop All Services
echo  [0] ❌ Exit
echo.
echo ================================================
echo.

set /p choice="Nhap lua chon cua ban: "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto restart_client
if "%choice%"=="3" goto restart_server
if "%choice%"=="4" goto open_browser
if "%choice%"=="5" goto stop_all
if "%choice%"=="0" goto exit
goto menu

:start_all
echo.
echo  ═══════════════════════════════════════════════
echo  ▶ Dang khoi dong Client va Server...
echo  ═══════════════════════════════════════════════
echo.

echo [1/2] Starting Server (port %SERVER_PORT%)...
start "Portal Server" cmd /k "cd /d "%SERVER_DIR%" && npm run start:dev"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Client (port %CLIENT_PORT%)...
start "Portal Client" cmd /k "cd /d "%CLIENT_DIR%" && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo  ✓ Da khoi dong thanh cong!
echo  ═══════════════════════════════════════════════
echo.
echo  🌐 Client: http://localhost:%CLIENT_PORT%
echo  🔧 Server: http://localhost:%SERVER_PORT%
echo.
pause
goto menu

:restart_client
echo.
echo  ═══════════════════════════════════════════════
echo  🔄 Dang khoi lai Client...
echo  ═══════════════════════════════════════════════
echo.

taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Client on port %CLIENT_PORT%...
start "Portal Client" cmd /k "cd /d "%CLIENT_DIR%" && npm run dev"

echo.
echo  ✓ Client da khoi dong lai!
echo.
pause
goto menu

:restart_server
echo.
echo  ═══════════════════════════════════════════════
echo  🔄 Dang khoi lai Server...
echo  ═══════════════════════════════════════════════
echo.

taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Server on port %SERVER_PORT%...
start "Portal Server" cmd /k "cd /d "%SERVER_DIR%" && npm run start:dev"

echo.
echo  ✓ Server da khoi dong lai!
echo.
pause
goto menu

:open_browser
start http://localhost:%CLIENT_PORT%
echo.
echo  🌐 Da mo trinh duyet!
echo.
pause
goto menu

:stop_all
echo.
echo  ═══════════════════════════════════════════════
echo  ⏹️  Dang dung tat ca services...
echo  ═══════════════════════════════════════════════
echo.

taskkill /F /IM node.exe >nul 2>&1

echo.
echo  ✓ Da dung tat ca services!
echo.
pause
goto menu

:exit
cls
echo.
echo  👋 Tam biet!
echo.
timeout /t 1 /nobreak >nul
exit
