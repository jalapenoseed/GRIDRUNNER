@echo off
setlocal
set "GR_ACTION=%~1"
if not defined GR_ACTION set "GR_ACTION=play"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Field-Workflow.ps1" -Action "%GR_ACTION%"
exit /b %errorlevel%
