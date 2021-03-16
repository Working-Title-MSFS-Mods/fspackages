param (
    [Parameter(Mandatory = $true)][string]$Project,
    [string]$Package,
    [string]$MinimumGameVersion = "1.14.5",
    [string]$OutputPath = ".\build\",
    [switch]$WatchFiles = $false,
    [switch]$CleanBuild = $false
)

# global var and action for filewatcher
$global:FileChanged = $false
$Action = 'Update-Packages'

Get-EventSubscriber -Force | Unregister-Event -Force

function Update-Packages {
    param (
        
    )
    [XML]$projectFile = Get-Content $Project
    $packages = @{}

    foreach ($packageEntry in $projectFile.Project.Packages.Package) {
        [XML]$packageFile = Get-Content $packageEntry
        $packageName = $packageFile.AssetPackage.Name
        if ($Package -and $packageName -ne $Package) {
            continue
        }
        
        $packageDef = $packageFile.AssetPackage
    
        $manifest = New-Object -TypeName PSObject -Property @{
            dependencies         = @()
            content_type         = $packageDef.ItemSettings.ContentType
            title                = $packageDef.ItemSettings.Title
            manufacturer         = ""
            creator              = $packageDef.ItemSettings.Creator
            package_version      = $packageDef.Version
            minimum_game_version = $MinimumGameVersion
            release_notes        = @{
                neutral = @{
                    LastUpdate   = ""
                    OlderHistory = ""
                }
            }
        }
    
        $packagePath = Join-Path $OutputPath $packageName
        $manifestPath = Join-Path $packagePath "manifest.json"
    
        if ($CleanBuild -eq $true) {
            Write-Host "Cleaning $packagePath..."
            Remove-Item -Path $packagePath -Recurse -ErrorAction SilentlyContinue
        }

        if ((Test-Path -Path $packagePath) -eq $false) {
            Write-Host "Creating package path $packagePath..."  
            New-Item -Path $packagePath -ItemType directory | Out-Null
        }
           
        Write-Host "Copying source files..."
        foreach ($assetGroup in $packageDef.AssetGroups.AssetGroup) {
            $src = Join-Path "." $assetGroup.AssetDir
            $dest = Join-Path $packagePath $assetGroup.OutputDir
            Write-Host "Copying $src to $dest..."
            robocopy $src $dest /XO /e  | Out-Null
        }
    
        Write-Host "Writing $manifestPath..."  
        $manifest | ConvertTo-Json | Out-File -FilePath $manifestPath -Encoding ASCII

        Write-Host "Building layout file..."
        $layoutEntries = @()
        foreach ($file in Get-ChildItem -Path $packagePath -Recurse -Exclude "manifest.json" -Attributes !Directory) {
            Push-Location $packagePath
    
            $layoutEntries += @{
                path = ($file | Resolve-Path -Relative).Replace('\', '/').Substring(2)
                size = $file.Length
                date = $file.LastWriteTime.ToFileTime()
            }
    
            Pop-Location
        }
        
        $layoutFilePath = Join-Path $packagePath "layout.json"
        Write-Host "Writing $layoutFilePath"
    
        $layoutFile = New-Object -Type PSObject -Property @{content = $layoutEntries }   
        $layoutFile | ConvertTo-Json | Out-File $layoutFilePath -Encoding ASCII
    
        Write-Host "Build finished."
    }   
}

function Wait-FileChange {
    param(
        [string]$Folder,
        [string]$Action
    )
    $ScriptBlock = [scriptblock]::Create($Action)

    $global:FileChanged = $false

    $Watcher = New-Object IO.FileSystemWatcher $Folder, "*.*" -Property @{ 
        IncludeSubdirectories = $true
        EnableRaisingEvents   = $true
        NotifyFilter          = [IO.NotifyFilters]'FileName, LastWrite'
    }
    $onChange = Register-ObjectEvent $Watcher -EventName "Changed" -Action {
        if($global:FileChanged -eq $false) {
            $details = $event.SourceEventArgs
            $Name = $details.Name
            $FullPath = $details.FullPath
            $OldFullPath = $details.OldFullPath
            $OldName = $details.OldName
            $ChangeType = $details.ChangeType
            $Timestamp = $event.TimeGenerated
            if($FullPath -NotLike ".\src\wtsdk*"){
                $text = "{0} was {1} at {2}" -f $FullPath, $ChangeType, $Timestamp
                Write-Host ""
                Write-Host $text -ForegroundColor Green
    
                $global:FileChanged = $true
            } elseif($FullPath -Like ".\src\wtsdk\src*") {
                $text = "{0} was {1} at {2}" -f $FullPath, $ChangeType, $Timestamp
                Write-Host ""
                Write-Host $text -ForegroundColor Green     
                Write-Host "npm run build...please wait..." -ForegroundColor Yellow 
                Push-Location "src\wtsdk"
                $global:FileChanged = $true
                & npm run build | Write-Host
                if (!$?) {
                    Pop-Location 
                    throw "npm build failed"
                }
                Pop-Location           
                Write-Host "build finished" -ForegroundColor Green
            }
        }
    }

    while ($global:FileChanged -eq $false) {
        Start-Sleep -Milliseconds 100
    }

    & $ScriptBlock 
    Unregister-Event -SubscriptionId $onChange.Id
}

if($Project -Like "*cj4*"){
    Write-Host "npm run build...please wait..." -ForegroundColor Yellow
    Push-Location "src\wtsdk"
    & npm run build | Write-Host
    if (!$?) {
        Pop-Location 
        throw "npm build failed"
    }
    Pop-Location  
}

Update-Packages

# FILE WATCHER
if ($WatchFiles -eq $true) {
    try {
        while (1 -eq 1) {
            Write-Host "Waiting for file changes... (CTRL+C to quit)"
            Wait-FileChange -Folder (Join-Path "." "src") -Action $Action
            Start-Sleep -Milliseconds 100
        }        
    }
    finally {
        Get-EventSubscriber -Force | Unregister-Event -Force
    }
}
