param (
    [Parameter(Mandatory = $true)][string]$Project,
    [string]$Package,
    [string]$MinimumGameVersion = "1.10.7",
    [string]$OutputPath = ".\build\",
    [switch]$WatchFiles = $false,
    [switch]$CleanBuild = $false
)

# global var and action for filewatcher
$global:FileChanged = $false
$Action = 'Update-Packages'

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

        Write-Host "Building css from scss..."
        $stylesheetPath = $packagePath
        $files = Get-ChildItem $stylesheetPath -Recurse -Include *.scss 
        for ($i = 0; $i -lt $files.Count; $i++) {
            $file = $files[$i]
            $fileName = $file.BaseName
            $filePath = $file.FullName
            if (-not $fileName.StartsWith("_")) {
                $directory = $file.DirectoryName
                $newFilePath = "$directory\$fileName.css"
                Write-Host "Compiling $fileName.scss..."
                build-tools\dart-sass\sass.bat --no-source-map $filePath $newFilePath                
            }
        }
        Remove-Item -Path $packagePath -recurse -Include *.scss

        Write-Host "Building js..."
        $files = Get-ChildItem $packagePath -Recurse -Include BuildJS
        for ($i = 0; $i -lt $files.Count; $i++) {
            $file = $files[$i]
            $string = "";
            $directory = $file.DirectoryName
            foreach ($line in Get-Content $file) {
                if ($line -ne "") {
                    $string += Get-Content "$directory/$line" -Raw
                    $string += "`n"
                }
            }
            $fileName = $file.BaseName
            $filePath = $file.FullName
            $newFilePath = "$directory\Scripts.js"    
            $string | Out-File $newFilePath
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
        $global:FileChanged = $true
    }

    while ($global:FileChanged -eq $false) {
        Start-Sleep -Milliseconds 100
    }

    & $ScriptBlock 
    Unregister-Event -SubscriptionId $onChange.Id
}

Update-Packages

# FILE WATCHER
if ($WatchFiles -eq $true) {
    while (1 -eq 1) {
        Write-Host "Waiting for file changes... (CTRL+C to quit)"
        Wait-FileChange -Folder (Join-Path "." "src") -Action $Action
        Start-Sleep -Milliseconds 100
    }
}