@echo off
title HonTech AutoCenter - Local LAN Server Launcher
color 0C
cls

echo ================================================================
echo         HONTECH AUTOCENTER - MULTI-DEVICE LOCAL SERVER
echo ================================================================
echo.

:: Detect current Wi-Fi / Hotspot IP
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "127.0.0.1"') do (
    set HOST_IP=%%a
    goto :ip_found
)

:ip_found
if "%HOST_IP%"=="" (
    set HOST_IP=localhost
)

echo  [HOST MACHINE IP] : %HOST_IP%
echo  [LOCAL PORT]      : 8000
echo.
echo  ----------------------------------------------------------------
echo   1. SHARE THIS LINK WITH MOBILE PHONES / TABLETS (SAME WI-FI):
echo      http://%HOST_IP%:8000
echo.
echo   2. OPEN ON THIS LAPTOP:
echo      http://localhost:8000
echo  ----------------------------------------------------------------
echo.
echo  Starting PHP 8.0 server on 0.0.0.0:8000...
echo  (Press CTRL+C anytime to stop the server)
echo.

php -S 0.0.0.0:8000 router.php
pause
