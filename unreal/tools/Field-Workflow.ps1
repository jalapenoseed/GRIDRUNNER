param(
    [ValidateSet('build','integrate','verify','play','editor','package')]
    [string]$Action = 'play',
    [string]$EngineRoot = 'C:\Program Files\Epic Games\UE_5.8',
    [string]$RuntimeRoot = 'D:\UNREAL-GRIDRUNNER-ASSETS',
    [string]$PackageRoot = 'D:\GRIDRUNNER-Builds\GhostSignal-FieldSlice'
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\GRIDRUNNERAssetLab'))
$project = Join-Path $projectRoot 'GRIDRUNNERAssetLab.uproject'
$editor = Join-Path $EngineRoot 'Engine\Binaries\Win64\UnrealEditor.exe'
$map = '/Game/GRIDRUNNER/Maps/L_GhostSignal_FieldSlice'
$env:TEMP = Join-Path $RuntimeRoot 'RuntimeTemp'
$env:TMP = $env:TEMP
if (!$env:ComSpec) { $env:ComSpec = Join-Path $env:SystemRoot 'System32\cmd.exe' }
New-Item -ItemType Directory $env:TEMP -Force | Out-Null
[Environment]::SetEnvironmentVariable('UE-LocalDataCachePath',(Join-Path $RuntimeRoot 'DerivedDataCache'),'Process')
[Environment]::SetEnvironmentVariable('UE-ZenDataPath',(Join-Path $RuntimeRoot 'DerivedDataCache\Zen'),'Process')
if (!(Test-Path $editor)) { throw "Unreal editor missing: $editor" }
if (!(Test-Path $project)) { throw "GRIDRUNNER project missing: $project" }
switch ($Action) {
    'build' {
        foreach ($target in @('GRIDRUNNERGameEditor', 'GRIDRUNNERGame')) {
            & (Join-Path $EngineRoot 'Engine\Build\BatchFiles\Build.bat') $target Win64 Development $project -WaitMutex -NoHotReload -NoUBA -MaxParallelActions=3
            if ($LASTEXITCODE -ne 0) { throw "$target C++ build failed: $LASTEXITCODE" }
        }
    }
    'integrate' {
        $report = Join-Path $projectRoot '..\validation\field_integration.json'
        $began = Get-Date
        $run = Start-Process -FilePath $editor -ArgumentList @('"'+$project+'"', '"-ExecutePythonScript='+$projectRoot+'\Content\Python\integrate_field_slice.py"', '-unattended','-nosplash') -PassThru -Wait
        if ($run.ExitCode -ne 0) { throw "Unreal integration exited $($run.ExitCode)" }
        if (!(Test-Path $report) -or (Get-Item $report).LastWriteTime -lt $began) { throw 'No fresh integration report' }
        $result = Get-Content $report -Raw | ConvertFrom-Json
        if ($result.status -ne 'complete') { throw ($result.errors -join '; ') }
        Write-Output 'Field map saved, reopened and verified.'
    }
    'verify' {
        $report = Join-Path $projectRoot 'Saved\Validation\field_runtime_smoke.json'
        $began = Get-Date
        $run = Start-Process -FilePath $editor -ArgumentList @('"'+$project+'"',$map,'-game','-GRSmokeTest','-unattended','-nosplash','-windowed','-ResX=1280','-ResY=720') -PassThru -Wait
        if ($run.ExitCode -ne 0) { throw "Runtime verification exited $($run.ExitCode)" }
        if (!(Test-Path $report) -or (Get-Item $report).LastWriteTime -lt $began) { throw 'Runtime did not write a fresh smoke report' }
        $result = Get-Content $report -Raw | ConvertFrom-Json
        if (!$result.passed) { throw ($result.checks_failed -join '; ') }
        Write-Output 'Runtime movement, mode transitions and relay/save checks passed.'
    }
    'play' { Start-Process $editor -WorkingDirectory $projectRoot -ArgumentList @('"'+$project+'"',$map,'-game','-windowed','-ResX=1280','-ResY=720') }
    'editor' { Start-Process $editor -WorkingDirectory $projectRoot -ArgumentList @('"'+$project+'"',$map) }
    'package' {
        & (Join-Path $EngineRoot 'Engine\Build\BatchFiles\RunUAT.bat') BuildCookRun "-project=$project" -target=GRIDRUNNERGame -noP4 -platform=Win64 -clientconfig=Development -build -cook -stage -pak -archive "-archivedirectory=$PackageRoot" "-map=$map" -unattended -utf8output
        if ($LASTEXITCODE -ne 0) { throw "Win64 packaging failed: $LASTEXITCODE" }
    }
}
