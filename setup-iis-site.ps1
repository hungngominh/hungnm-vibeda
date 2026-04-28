#Requires -RunAsAdministrator
<#
.SYNOPSIS
    One-time IIS setup for hungnm-vibeda.allianceits.com -> Docker container on port 3777
    Run this once as Administrator. After this, Jenkins handles deployments automatically.
#>

$SiteName    = "hungnm-vibeda"
$Domain      = "hungnm-vibeda.allianceits.com"
$SiteDir     = "C:\inetpub\hungnm-vibeda"
$WebConfig   = Join-Path $PSScriptRoot "web.config"
$AppCmd      = "$env:windir\system32\inetsrv\appcmd.exe"

Write-Host "=== Setting up IIS site for $Domain ===" -ForegroundColor Cyan

# 1. Create physical directory
if (-not (Test-Path $SiteDir)) {
    New-Item -ItemType Directory -Path $SiteDir -Force | Out-Null
    Write-Host "[OK] Created $SiteDir"
} else {
    Write-Host "[OK] Directory already exists: $SiteDir"
}

# 2. Copy web.config
Copy-Item -Path $WebConfig -Destination "$SiteDir\web.config" -Force
Write-Host "[OK] Copied web.config to $SiteDir"

# 3. Enable ARR proxy (global, one-time)
& $AppCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
Write-Host "[OK] ARR proxy enabled"

# 4. Create IIS site if not exists
$existingSite = & $AppCmd list site /name:"$SiteName" 2>&1
if ($existingSite -match "SITE ""$SiteName""") {
    Write-Host "[OK] Site '$SiteName' already exists, updating binding..."
    & $AppCmd set site /site.name:"$SiteName" /+bindings.[protocol='http',bindingInformation='*:80:$Domain'] 2>&1 | Out-Null
} else {
    & $AppCmd add site /name:"$SiteName" /physicalPath:"$SiteDir" /bindings:"http/*:80:$Domain" 2>&1
    Write-Host "[OK] Created IIS site '$SiteName' bound to $Domain"
}

# 5. Set app pool to No Managed Code (proxy site, no .NET needed)
$PoolName = "${SiteName}AppPool"
$existingPool = & $AppCmd list apppool /name:"$PoolName" 2>&1
if ($existingPool -notmatch "APPPOOL") {
    & $AppCmd add apppool /name:"$PoolName" /managedRuntimeVersion:"" 2>&1 | Out-Null
    Write-Host "[OK] Created app pool '$PoolName'"
}
& $AppCmd set site /site.name:"$SiteName" /[path='/'].applicationPool:"$PoolName" 2>&1 | Out-Null
& $AppCmd set apppool /apppool.name:"$PoolName" /managedRuntimeVersion:"" 2>&1 | Out-Null
Write-Host "[OK] App pool configured (No Managed Code)"

# 6. Start the site
& $AppCmd start site /site.name:"$SiteName" 2>&1 | Out-Null
Write-Host "[OK] Site started"

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "IIS site '$SiteName' is configured for domain: $Domain"
Write-Host "Traffic will be proxied to Docker container on http://localhost:3777"
Write-Host ""
Write-Host "Verify: curl -H 'Host: $Domain' http://localhost/api/cloud"
