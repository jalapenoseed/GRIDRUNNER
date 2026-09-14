@echo off
setlocal
if not defined TEMP set "TEMP=%LOCALAPPDATA%\Temp"
if not defined TMP set "TMP=%TEMP%"
if not defined ComSpec set "ComSpec=%SystemRoot%\System32\cmd.exe"
set "GR_PROJECT_DIR=%~dp0GRIDRUNNERAssetLab"
set "GR_PROJECT=%GR_PROJECT_DIR%\GRIDRUNNERAssetLab.uproject"
if not defined GR_UNREAL_EDITOR set "GR_UNREAL_EDITOR=%ProgramFiles%\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe"
if not exist "%GR_UNREAL_EDITOR%" (
  echo Unreal Editor 5.8 was not found. Set GR_UNREAL_EDITOR to UnrealEditor.exe.
  exit /b 1
)
if /I "%~1"=="build" goto Build
if /I "%~1"=="verify" goto Verify
if /I "%~1"=="capture" goto Capture
if /I "%~1"=="play" goto Play
start "" /D "%GR_PROJECT_DIR%" "%GR_UNREAL_EDITOR%" "%GR_PROJECT%"
exit /b 0
:Build
"%GR_UNREAL_EDITOR%" "%GR_PROJECT%" -ExecutePythonScript="%GR_PROJECT_DIR%\Content\Python\build_ghost_signal.py" -unattended -nosplash
if errorlevel 1 exit /b %errorlevel%
"%GR_UNREAL_EDITOR%" "%GR_PROJECT%" -ExecutePythonScript="%GR_PROJECT_DIR%\Content\Python\build_ghost_signal.py" -unattended -nosplash
exit /b %errorlevel%
:Verify
"%GR_UNREAL_EDITOR%" "%GR_PROJECT%" -ExecutePythonScript="%GR_PROJECT_DIR%\Content\Python\verify_ghost_signal.py" -unattended -nosplash
exit /b %errorlevel%
:Capture
"%GR_UNREAL_EDITOR%" "%GR_PROJECT%" -ExecCmds="py %GR_PROJECT_DIR%\Content\Python\capture_ghost_signal.py" -unattended -nosplash
exit /b %errorlevel%
:Play
start "" /D "%GR_PROJECT_DIR%" "%GR_UNREAL_EDITOR%" "%GR_PROJECT%" /Game/GRIDRUNNER/Maps/L_GhostSignal_Prototype -game -windowed -ResX=1600 -ResY=900
exit /b 0
