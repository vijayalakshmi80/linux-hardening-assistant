@echo off
REM ============================================================
REM Start the Docker test target for Linux Hardening Assistant
REM ============================================================

echo.
echo ============================================================
echo Starting Linux Hardening Assistant - Docker Test Target
echo ============================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Start the container
echo Starting the test target container...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the container!
    echo Run "docker-compose logs" to see error details.
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Container started successfully!
echo.
echo Waiting for SSH service to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ============================================================
echo SSH Connection Details:
echo ============================================================
echo   Host:     localhost
echo   Port:     2222
echo   Username: testuser
echo   Password: testpass123
echo.
echo   OR use root:
echo   Username: root
echo   Password: testroot123
echo ============================================================
echo.
echo Use these credentials in the Linux Hardening Assistant UI
echo to connect and run your first audit!
echo.
echo To stop: docker-compose down
echo To view logs: docker logs linux-hardening-test-target
echo.

REM Test if SSH is responding
echo Testing SSH connection...
powershell -Command "& { (New-Object Net.Sockets.TcpClient).Connect('localhost', 2222) }" 2>nul
if %errorlevel% equ 0 (
    echo [OK] SSH service is responding on port 2222
) else (
    echo [WARNING] SSH service may still be starting up...
    echo Wait a few more seconds and try connecting.
)

echo.
pause
