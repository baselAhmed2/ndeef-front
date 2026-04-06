$local = "g:\gradProjectFront\laundry\src"
$repo = "C:\Users\Royal\.gemini\antigravity\user2_repo\src"

Write-Host "Replacing (app) directory..."
if (Test-Path "$local\app\(app)") {
    Remove-Item -Path "$local\app\(app)" -Recurse -Force
}
Copy-Item -Path "$repo\app\(app)" -Destination "$local\app\" -Recurse

Write-Host "Replacing pages (preserving admin)..."
Get-ChildItem -Path "$local\app\pages" -File | Where-Object { $_.Name -ne "SuperAdminDashboard.tsx" } | Remove-Item -Force
Get-ChildItem -Path "$repo\app\pages" -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$local\app\pages\" -Force
}

Write-Host "Replacing components (preserving layout)..."
Get-ChildItem -Path "$local\app\components" -File | Remove-Item -Force
Get-ChildItem -Path "$local\app\components" -Directory | Where-Object { $_.Name -ne "layout" } | Remove-Item -Recurse -Force

Get-ChildItem -Path "$repo\app\components" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$local\app\components\" -Recurse -Force
}

Write-Host "Replacing context..."
if (Test-Path "$local\app\context") {
    Remove-Item -Path "$local\app\context" -Recurse -Force
}
Copy-Item -Path "$repo\app\context" -Destination "$local\app\" -Recurse

Write-Host "Replacing lib/api.ts..."
if (Test-Path "$repo\app\lib\api.ts") {
    Copy-Item -Path "$repo\app\lib\api.ts" -Destination "$local\app\lib\api.ts" -Force
}
if (Test-Path "$repo\app\lib\utils.ts") {
    Copy-Item -Path "$repo\app\lib\utils.ts" -Destination "$local\app\lib\utils.ts" -Force
}

Write-Host "Replacing app root files..."
Copy-Item -Path "$repo\app\globals.css" -Destination "$local\app\globals.css" -Force
Copy-Item -Path "$repo\app\layout.tsx" -Destination "$local\app\layout.tsx" -Force

Write-Host "Replacing assets, styles, imports..."
if (Test-Path "$local\assets") { Remove-Item -Path "$local\assets" -Recurse -Force }
Copy-Item -Path "$repo\assets" -Destination "$local\" -Recurse -Force

if (Test-Path "$local\styles") { Remove-Item -Path "$local\styles" -Recurse -Force }
Copy-Item -Path "$repo\styles" -Destination "$local\" -Recurse -Force

if (Test-Path "$local\imports") { Remove-Item -Path "$local\imports" -Recurse -Force }
Copy-Item -Path "$repo\imports" -Destination "$local\" -Recurse -Force

Write-Host "Migration script completed."
