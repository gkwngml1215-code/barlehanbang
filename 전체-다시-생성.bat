@echo off
chcp 65001 >nul
title 바를정한방병원 안면마비·재활센터 - 전체 다시 생성
cd /d "%~dp0"
echo 헤더·푸터 삽입 → 설정 반영 → 칼럼 생성 → SEO 주입 → dist 생성
echo.
node tools\build.js
echo.
pause
