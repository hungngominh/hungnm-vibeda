#Requires -RunAsAdministrator
$AppCmd    = "$env:windir\system32\inetsrv\appcmd.exe"
$SiteName  = "hungnm-vibeda"
$OldDomain = "hungnm-vibeda.allianceits.com"
$NewDomain = "hungnm-vibeda.allianceitsc.com"

& $AppCmd set site /site.name:"$SiteName" /-bindings.[protocol='http',bindingInformation="*:80:$OldDomain"] 2>$null
& $AppCmd set site /site.name:"$SiteName" /+bindings.[protocol='http',bindingInformation="*:80:$NewDomain"]
& $AppCmd stop site  /site.name:"$SiteName"
& $AppCmd start site /site.name:"$SiteName"
Write-Host "Done. New binding: $NewDomain" -ForegroundColor Green
