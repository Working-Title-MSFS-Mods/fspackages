param (
    [Parameter(Mandatory=$true)][string]$Project,
    [string]$Package,
    [string]$MinimumGameVersion = "1.7.14",
    [string]$OutputPath = ".\build\"
)

[XML]$projectFile = Get-Content $Project
$packages = @{}

foreach($packageEntry in $projectFile.Project.Packages.Package) {
    [XML]$packageFile = Get-Content $packageEntry
    $packageName = $packageFile.AssetPackage.Name
    if ($Package -and $packageName -ne $Package)  {
        continue
    }
    
    $packageDef = $packageFile.AssetPackage

    $manifest = New-Object -TypeName PSObject -Property @{
        dependencies = @()
        content_type = $packageDef.ItemSettings.ContentType
        title = $packageDef.ItemSettings.Title
        manufacturer = ""
        creator = $packageDef.ItemSettings.Creator
        package_version = $packageDef.Version
        minimum_game_version = $MinimumGameVersion
        release_notes = @{
            neutral = @{
                LastUpdate = ""
                OlderHistory = ""
            }
        }
    }

    $packagePath = Join-Path $OutputPath $packageName
    $manifestPath = Join-Path $packagePath "manifest.json"

    Write-Host "Cleaning $packagePath..."
    Remove-Item -Path $packagePath -Recurse -ErrorAction SilentlyContinue
    New-Item -Path $packagePath -ItemType directory | Out-Null

    Write-Host "Writing $manifestPath..."  
    $manifest | ConvertTo-Json | Out-File $manifestPath -Encoding ASCII

    Write-Host "Copying source files..."
    foreach($assetGroup in $packageDef.AssetGroups.AssetGroup) {
        $dest = Join-Path $packagePath $assetGroup.OutputDir
        foreach($assetSubFolder in Get-ChildItem -Path $assetGroup.AssetDir) {
            $fullAssetFolderName = $assetSubFolder.FullName
            Write-Host "Copying $fullAssetFolderName to $dest..."
            Copy-Item -Path $assetSubFolder.FullName -Destination $dest -Recurse -Force
        }

    }

    Write-Host "Building layout file..."
    $layoutEntries = @()
    foreach($file in Get-ChildItem -Path $packagePath -Recurse -Exclude "manifest.json" -Attributes !Directory) {
        Push-Location $packagePath

        $layoutEntries += @{
            path = ($file | Resolve-Path -Relative).Replace('\','/').Substring(2)
            size = $file.Length
            date = $file.LastWriteTime.ToFileTime()
        }

        Pop-Location
    }
    
    $layoutFilePath = Join-Path $packagePath "layout.json"
    Write-Host "Writing $layoutFilePath"

    $layoutFile = New-Object -Type PSObject -Property @{content = $layoutEntries}   
    $layoutFile | ConvertTo-Json | Out-File $layoutFilePath -Encoding ASCII

    Write-Host "Build finished."
}
