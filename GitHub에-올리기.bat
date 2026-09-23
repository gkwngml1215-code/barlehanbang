@echo off
chcp 65001 >nul
title 바를정한방병원 안면마비·재활센터 - GitHub 에 올리기
cd /d "%~dp0"
echo.
echo  홈페이지(main) 와 어드민(admin) 을 GitHub 저장소 gkwngml1215-code/barlehanbang 에 올립니다.
echo  올라가면 Cloudflare Pages 가 1~2분 뒤 자동 배포합니다.
echo.
git add -A
git diff --cached --quiet
if errorlevel 1 (
  set /p MSG=변경 내용 한 줄 설명 (비우면 날짜로 기록):
  if "%MSG%"=="" set MSG=홈페이지 갱신 %date% %time:~0,5%
  git commit -m "%MSG%"
) else (
  echo 커밋할 변경 내용이 없습니다. 원격과 동기화만 합니다.
)
git push -u origin main
if errorlevel 1 (
  echo.
  echo [오류] 푸시에 실패했습니다. 인터넷 연결과 GitHub 로그인 상태를 확인하세요.
  pause
  exit /b 1
)
node tools\sync-admin.js
echo.
echo 완료. Cloudflare Pages 배포 상태는 https://dash.cloudflare.com 에서 확인하세요.
pause
