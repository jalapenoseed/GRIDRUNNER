param(
    [string]$EngineRoot = 'C:\Program Files\Epic Games\UE_5.8',
    [string]$SourceContent = 'D:\UNREAL-GRIDRUNNER-ASSETS\Projects\GR_AssetReview\Content',
    [string]$ProjectRoot = (Join-Path $PSScriptRoot '..\GRIDRUNNERAssetLab'),
    [string]$Manifest = (Join-Path $PSScriptRoot '..\validation\field_vendor_manifest.json'),
    [string]$TemplateManifest = (Join-Path $PSScriptRoot '..\validation\field_template_manifest.json')
)
$ErrorActionPreference = 'Stop'
$contentRoot = [IO.Path]::GetFullPath((Join-Path $ProjectRoot 'Content'))
if (!(Test-Path $Manifest -PathType Leaf)) { throw "Vendor manifest missing: $Manifest" }
if (!(Test-Path $TemplateManifest -PathType Leaf)) { throw "Template manifest missing: $TemplateManifest" }
$data = Get-Content $Manifest -Raw | ConvertFrom-Json
$templates = Get-Content $TemplateManifest -Raw | ConvertFrom-Json
$planned = @()
foreach ($entry in $data.files) {
    $planned += [PSCustomObject]@{ Source=(Join-Path $SourceContent $entry.path); Destination=(Join-Path $contentRoot $entry.path); Hash=$entry.sha256; Kind='vendor' }
}
foreach ($entry in $templates) {
    $planned += [PSCustomObject]@{ Source=(Join-Path $EngineRoot $entry.source_relative); Destination=(Join-Path $contentRoot $entry.path); Hash=$entry.sha256; Kind='template' }
}
if ($data.files.Count -eq 0 -or $templates.Count -eq 0) { throw 'Asset manifests must contain vendor and template files' }

# Validate every source and existing destination before creating new files.
foreach ($item in $planned) {
    $item.Destination = [IO.Path]::GetFullPath($item.Destination)
    if (!$item.Destination.StartsWith($contentRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Manifest destination is outside project Content: $($item.Destination)"
    }
    if (!(Test-Path $item.Source -PathType Leaf)) { throw "Missing $($item.Kind) source asset: $($item.Source)" }
    if ((Get-FileHash $item.Source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Hash) {
        throw "Source differs from verified $($item.Kind) version: $($item.Source)"
    }
    if (Test-Path $item.Destination) {
        if (!(Test-Path $item.Destination -PathType Leaf) -or (Get-FileHash $item.Destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Hash) {
            throw "Refusing to overwrite modified game asset: $($item.Destination)"
        }
    }
}
foreach ($item in $planned) {
    if (!(Test-Path $item.Destination)) {
        New-Item -ItemType Directory -Path (Split-Path $item.Destination) -Force | Out-Null
        Copy-Item $item.Source $item.Destination
    }
    if ((Get-FileHash $item.Destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Hash) {
        throw "Copy verification failed: $($item.Destination)"
    }
}
Write-Output "Restored and SHA-256 verified $($data.files.Count) vendor files and $($templates.Count) installed-engine template files."
