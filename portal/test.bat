@echo off
chcp 65001 >nul
title Test Portal

echo === TEST START ===
echo.

echo Checking directories...
if not exist "client" (
    echo [ERROR] client folder not found!
    pause
    exit
)

if not exist "server" (
    echo [ERROR] server folder not found!
    pause
    exit
)

echo [OK] Folders found
echo.
echo Press any key to exit...
pause >nul
