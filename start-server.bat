@echo off
title Ngoc-Tieu-Cac-Admin

REM Di chuyển tới folder project
cd /d %USERPROFILE%\Desktop\Ngoc-Tieu-Cac-Admin

IF NOT EXIST package.json (
    echo ❌ Không tìm thấy folder Ngoc-Tieu-Cac-Admin
    pause
    exit /b
)

echo 🚀 Starting Ngoc-Tieu-Cac-Admin...

REM Chạy project
npm run start

pause