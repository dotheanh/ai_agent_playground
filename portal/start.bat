@echo off
setlocal

set "CLIENT_DIR=%~dp0client"
set "SERVER_DIR=%~dp0server"
set "CLIENT_PORT=3000"
set "SERVER_PORT=3001"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ClientDir='%CLIENT_DIR%'; $ServerDir='%SERVER_DIR%'; $ClientPort='%CLIENT_PORT%'; $ServerPort='%SERVER_PORT%';" ^
  "function Pause{ Write-Host ''; Read-Host 'Nhan Enter de tiep tuc...' | Out-Null }" ^
  "function Start-Svc{ param($Name, $Dir, $Cmd) Start-Process cmd -ArgumentList '/k', 'cd /d', $Dir, '&&', $Cmd -WindowStyle Normal }" ^
  "while($true){" ^
  "  Clear-Host;" ^
  "  Write-Host '=== Portal Launcher ===' -ForegroundColor Cyan;" ^
  "  Write-Host ('Client: ' + $ClientDir + ' (port ' + $ClientPort + ')') -ForegroundColor Gray;" ^
  "  Write-Host ('Server: ' + $ServerDir + ' (port ' + $ServerPort + ')') -ForegroundColor Gray;" ^
  "  Write-Host '';" ^
  "  Write-Host '1) Start Client + Server';" ^
  "  Write-Host '2) Restart Client';" ^
  "  Write-Host '3) Restart Server';" ^
  "  Write-Host '4) Open Localhost in Browser';" ^
  "  Write-Host '5) Stop All Services';" ^
  "  Write-Host '0) Thoat';" ^
  "  $c = Read-Host 'Chon (0-5)';" ^
  "  switch($c){" ^
  "    '1'{ " ^
  "      Write-Host 'Starting Server...' -ForegroundColor Yellow;" ^
  "      Start-Process cmd -ArgumentList '/k', 'cd /d', $ServerDir, '&&', 'npm run start:dev';" ^
  "      Start-Sleep 3;" ^
  "      Write-Host 'Starting Client...' -ForegroundColor Yellow;" ^
  "      Start-Process cmd -ArgumentList '/k', 'cd /d', $ClientDir, '&&', 'npm run dev';" ^
  "      Write-Host 'Done! Client: http://localhost:' + $ClientPort ', Server: http://localhost:' + $ServerPort -ForegroundColor Green;" ^
  "      Pause " ^
  "    }" ^
  "    '2'{ " ^
  "      Write-Host 'Restarting Client...' -ForegroundColor Yellow;" ^
  "      Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force;" ^
  "      Start-Sleep 2;" ^
  "      Start-Process cmd -ArgumentList '/k', 'cd /d', $ClientDir, '&&', 'npm run dev';" ^
  "      Write-Host 'Client restarted!' -ForegroundColor Green;" ^
  "      Pause " ^
  "    }" ^
  "    '3'{ " ^
  "      Write-Host 'Restarting Server...' -ForegroundColor Yellow;" ^
  "      Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force;" ^
  "      Start-Sleep 2;" ^
  "      Start-Process cmd -ArgumentList '/k', 'cd /d', $ServerDir, '&&', 'npm run start:dev';" ^
  "      Write-Host 'Server restarted!' -ForegroundColor Green;" ^
  "      Pause " ^
  "    }" ^
  "    '4'{ Start-Process ('http://localhost:' + $ClientPort); Write-Host 'Browser opened!' -ForegroundColor Green; Pause }" ^
  "    '5'{ Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Host 'All services stopped!' -ForegroundColor Green; Pause }" ^
  "    '0'{ break }" ^
  "    default{ Write-Host 'Sai lua chon!' -ForegroundColor Yellow; Start-Sleep 1 }" ^
  "  }" ^
  "}"

if errorlevel 1 pause
endlocal
