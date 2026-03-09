# Copilot Desktop - Release Script
# Usage: .\scripts\release.ps1 -Version "0.2.0"
# This builds, packages, and publishes a new release to GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

Write-Host "`n=== Copilot Desktop Release v$Version ===" -ForegroundColor Cyan

# Step 1: Update version in package.json
Write-Host "`n[1/6] Updating version to $Version..." -ForegroundColor Yellow
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
$pkg.version = $Version
$pkg | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
Write-Host "  OK" -ForegroundColor Green

# Step 2: Build
Write-Host "`n[2/6] Building renderer + main..." -ForegroundColor Yellow
npx webpack --mode production 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "  Webpack build failed!" -ForegroundColor Red; exit 1 }
npx tsc -p tsconfig.main.json 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "  TypeScript build failed!" -ForegroundColor Red; exit 1 }
Write-Host "  OK" -ForegroundColor Green

# Step 3: Package
Write-Host "`n[3/6] Packaging Windows (NSIS + Portable)..." -ForegroundColor Yellow
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
Remove-Item "dist\win-unpacked" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "dist\Copilot-CLI-Desktop-*" -Force -ErrorAction SilentlyContinue
npx electron-builder --win nsis portable 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "  Build failed!" -ForegroundColor Red; exit 1 }

$setup = "dist\Copilot-CLI-Desktop-Setup-$Version.exe"
$portable = "dist\Copilot-CLI-Desktop-Portable-$Version.exe"
$blockmap = "dist\Copilot-CLI-Desktop-Setup-$Version.exe.blockmap"
$latestYml = "dist\latest.yml"

$setupSize = [math]::Round((Get-Item $setup).Length / 1MB, 1)
Write-Host "  Setup: $setupSize MB | Portable: $([math]::Round((Get-Item $portable).Length / 1MB, 1)) MB" -ForegroundColor Green

# Step 4: Copy to release folder
Write-Host "`n[4/6] Copying to release folder..." -ForegroundColor Yellow
New-Item -Path "release\windows" -ItemType Directory -Force | Out-Null
# Clean old versions
Remove-Item "release\windows\Copilot-CLI-Desktop-*" -Force -ErrorAction SilentlyContinue
Copy-Item $setup "release\windows\" -Force
Copy-Item $portable "release\windows\" -Force
Copy-Item $blockmap "release\windows\" -Force
Copy-Item $latestYml "release\windows\" -Force
Write-Host "  OK" -ForegroundColor Green

# Step 5: Git commit & push
Write-Host "`n[5/6] Committing and pushing..." -ForegroundColor Yellow
git add -A
git commit -m "release: v$Version`n`nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push personal main --force 2>&1
git push origin main --force 2>&1
Write-Host "  OK" -ForegroundColor Green

# Step 6: Create GitHub Release (with latest.yml for auto-updater)
Write-Host "`n[6/6] Publishing GitHub Release..." -ForegroundColor Yellow
$ghExe = "C:\Program Files\GitHub CLI\gh.exe"

& $ghExe release create "v$Version" `
    --repo AllenS0104/Copilot-CLI-Desktop `
    --title "v$Version" `
    --generate-notes `
    $setup `
    $portable `
    $blockmap `
    $latestYml

Write-Host "`n=== Release v$Version published! ===" -ForegroundColor Green
Write-Host "  https://github.com/AllenS0104/Copilot-CLI-Desktop/releases/tag/v$Version" -ForegroundColor Cyan
Write-Host "`n  latest.yml uploaded - existing users will auto-detect this update.`n" -ForegroundColor Yellow
