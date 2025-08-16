$currentLocation = Get-Location
$rustHost = rustc -Vv | Select-String "host:" | ForEach-Object { $_.Line.Split(" ")[1] }

# 检测是否为Windows平台
$isWindows = $env:OS -eq "Windows_NT"

cmake ./lpac -B ./lpac/build
if ($LASTEXITCODE -eq 0) {
    cmake --build ./lpac/build
    
    $originalName = "lpac"
    
    $newName = if ($isWindows) {
        "$originalName-$rustHost.exe"
    } else {
        "$originalName-$rustHost"
    }
    
    $originalPath = if ($isWindows) {
        "./lpac/build/output/$originalName.exe"
    } else {
        "./lpac/build/output/$originalName"
    }
    
    $destinationDir = "./src-tauri/sidecar/"
    
    # 确保目标目录存在
    if (-not (Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force
    }
    
    if (Test-Path $originalPath) {
        Move-Item -Path $originalPath -Destination "$destinationDir$newName" -Force
    } else {
        Write-Host "Error: Build output not found at $originalPath"
    }
}