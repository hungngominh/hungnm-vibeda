#Requires -RunAsAdministrator
# Run once as Administrator to register the IIS site

$SiteName = "hungnm-vibeda"
$Domain   = "hungnm-vibeda.allianceits.com"
$SiteDir  = "C:\inetpub\hungnm-vibeda"
$AppCmd   = "$env:windir\system32\inetsrv\appcmd.exe"
$PoolName = "${SiteName}AppPool"

# Enable ARR proxy
& $AppCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost

# Create app pool (No Managed Code)
& $AppCmd list apppool /name:"$PoolName" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $AppCmd add apppool /name:"$PoolName" /managedRuntimeVersion:""
}
& $AppCmd set apppool /apppool.name:"$PoolName" /managedRuntimeVersion:""

# Remove site if exists (clean state)
& $AppCmd delete site /site.name:"$SiteName" 2>$null | Out-Null

# Create site fresh
& $AppCmd add site /name:"$SiteName" /physicalPath:"$SiteDir" /bindings:"http/*:80:$Domain"
& $AppCmd set site /site.name:"$SiteName" /[path='/'].applicationPool:"$PoolName"

# Start
& $AppCmd start apppool /apppool.name:"$PoolName"
& $AppCmd start site /site.name:"$SiteName"

Write-Host ""
Write-Host "Done! Testing..." -ForegroundColor Green
Start-Sleep -Seconds 2
$r = Invoke-WebRequest -Uri "http://localhost/test.html" -Headers @{"Host"="$Domain"} -UseBasicParsing -ErrorAction SilentlyContinue
if ($r -and $r.StatusCode -eq 200) {
    Write-Host "SUCCESS: IIS site is routing correctly" -ForegroundColor Green
} else {
    Write-Host "Site created. Verify: curl -H 'Host: $Domain' http://localhost/api/cloud" -ForegroundColor Yellow
}
