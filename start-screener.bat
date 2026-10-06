@echo off
cd /d "%~dp0"
title TejStockAI - Cross-Platform Market Intelligence, TradingView Charts & Broker AI Copilot
echo =========================================================================
echo    TejStockAI - PRO STOCK SCREENER & BROKER AI COPILOT
echo    Compatible with Windows (all versions) & Android Native PWA
echo    Zerodha Kite, Angel One, Upstox, & Dhan Market Intelligence Terminal
echo =========================================================================
echo.

:: Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b
)

:: Check if node_modules exists
if not exist node_modules (
    echo [INFO] Installing required dependencies...
    call npm install
)

echo [INFO] Starting Chartink Screener Server...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
node server.js
pause
