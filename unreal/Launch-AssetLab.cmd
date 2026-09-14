@echo off
setlocal
rem Remote sessions may omit variables required by Unreal's Build.bat.
if not defined TEMP set "TEMP=%LOCALAPPDATA%\Temp"
if not defined TMP set "TMP=%TEMP%"
if not defined ComSpec set "ComSpec=%SystemRoot%\System32\cmd.exe"
set "GR_PROJECT_DIR=%~dp0GRIDRUNNERAssetLab"
set "GR_PROJECT=%GR_PROJECT_DIR%\GRIDRUNNERAssetLab.uproject"
if not defined GR_UNREAL_EDITOR set "GR_UNREAL_EDITOR=%ProgramFiles%\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe"
if not exist "%GR_UNREAL_EDITOR%" (
  echo Unreal Editor not found. Set GR_UNREAL_EDITOR to its executable path.
  exit /b 1
)
if /I "%~1"=="build" goto BuildShowroom
start "" /D "%GR_PROJECT_DIR%" "%GR_UNREAL_EDITOR%" "%GR_PROJECT%" %*
exit /b 0
:BuildShowroom
"%GR_UNREAL_EDITOR%" "%GR_PROJECT%" -ExecutePythonScript="%GR_PROJECT_DIR%\Content\Python\build_asset_lab.py" -unattended -nosplash
exit /b %errorlevel%
