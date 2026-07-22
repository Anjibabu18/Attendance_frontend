param(
  [string]$BackendRepo = "https://github.com/Anjibabu18/Attendance_Backend.git",
  [string]$FrontendRepo = "https://github.com/Anjibabu18/Attendance_frontend.git"
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$root = Resolve-Path "$PSScriptRoot\.."
$backendDir = "C:\tmp\attendance-backend-$stamp"
$frontendDir = "C:\tmp\attendance-frontend-$stamp"
$backendZip = "$backendDir.zip"
$frontendZip = "$frontendDir.zip"

Push-Location $root
try {
  git archive HEAD:backend -o $backendZip
  git archive HEAD:frontend -o $frontendZip
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Path $backendDir | Out-Null
New-Item -ItemType Directory -Path $frontendDir | Out-Null
Expand-Archive -Path $backendZip -DestinationPath $backendDir
Expand-Archive -Path $frontendZip -DestinationPath $frontendDir

function Publish-Repo([string]$Path, [string]$Repo, [string]$Message) {
  Push-Location $Path
  try {
    git init -b main
    git config user.name "Anjibabu18"
    git config user.email "anushamilktrading@gmail.com"
    git add .
    git commit -m $Message
    git remote add origin $Repo
    git push -f -u origin main
  } finally {
    Pop-Location
  }
}

Publish-Repo $backendDir $BackendRepo "Initial backend deployment"
Publish-Repo $frontendDir $FrontendRepo "Initial frontend deployment"

Write-Host "Backend pushed from $backendDir"
Write-Host "Frontend pushed from $frontendDir"
