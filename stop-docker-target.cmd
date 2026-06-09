@echo off
REM ============================================================
REM Stop the Docker test target for Linux Hardening Assistant
REM ============================================================

echo.
echo ============================================================
echo Stopping Linux Hardening Assistant - Docker Test Target
echo ============================================================
echo.

docker-compose down

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to stop the container!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Container stopped successfully!
echo.
pause
