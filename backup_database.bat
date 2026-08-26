@echo off
setlocal enabledelayedexpansion
cls

echo ================================================================
echo         HONTECH AUTOCENTER - AUTOMATED DATABASE BACKUP
echo ================================================================
echo.

:: Generate clean timestamp YYYY-MM-DD_HH-MM
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%

:: Define target backup folder
set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo  [+] Created backup directory: %BACKUP_DIR%
)

set BACKUP_FILE=%BACKUP_DIR%\hontech_backup_%TIMESTAMP%.sql

echo  [TARGET DATABASE] : hontech
echo  [BACKUP FILE]     : %BACKUP_FILE%
echo.
echo  Backing up database tables (users, jobs, security_logs)...

:: Check for mysqldump in XAMPP path
set MYSQLDUMP_PATH=C:\xampp\mysql\bin\mysqldump.exe
if not exist "%MYSQLDUMP_PATH%" (
    set MYSQLDUMP_PATH=mysqldump
)

"%MYSQLDUMP_PATH%" -u root --databases hontech > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ================================================================
    echo  [SUCCESS] Database snapshot saved successfully in ^< 5 seconds!
    echo  [LOCATION] %BACKUP_FILE%
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo  [ERROR] Database backup failed. Please check if MySQL is running.
    echo ================================================================
)

echo.
pause
