# Package QuickDigest AI for Chrome Web Store upload.
# Run from repo root: .\scripts\build-store-zip.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out = Join-Path $root "dist"
$zip = Join-Path $out "quickdigest-ai-store.zip"

New-Item -ItemType Directory -Force -Path $out | Out-Null
if (Test-Path $zip) { Remove-Item $zip }

$staging = Join-Path $env:TEMP "quickdigest-store-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $staging | Out-Null

Copy-Item (Join-Path $root "manifest.json") $staging
Copy-Item (Join-Path $root "src") (Join-Path $staging "src") -Recurse

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zip -Force
Remove-Item $staging -Recurse -Force

Write-Host "Created: $zip"
Write-Host "Upload this file in Chrome Web Store Developer Dashboard."
