@echo off
title 바를정한방병원 안면마비·재활센터 - 로컬 서버
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [오류] Node.js 가 설치되어 있지 않습니다.
  echo https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
  echo.
  pause
  exit /b 1
)
echo.
echo  홈페이지  http://localhost:8080/
echo  어드민    http://localhost:8080/admin/   (비밀번호는 tools\admin-config.json)
echo.
echo  이 창을 닫으면 서버가 꺼집니다. 끝낼 때는 Ctrl + C 또는 창 닫기.
echo.
start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:8080/admin/"
node tools\admin-server.js
echo.
echo 서버가 종료되었습니다. 포트 8080 이 이미 사용 중이면 이전 창을 닫고 다시 실행하세요.
pause
