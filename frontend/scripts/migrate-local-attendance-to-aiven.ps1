param(
  [string]$LocalHost = "localhost",
  [int]$LocalPort = 3306,
  [string]$LocalUser = $(if ($env:LOCAL_DB_USER) { $env:LOCAL_DB_USER } else { "root" }),
  [string]$LocalDb = $(if ($env:LOCAL_DB_NAME) { $env:LOCAL_DB_NAME } else { "attendance" }),

  [string]$RemoteHost = $(if ($env:AIVEN_HOST) { $env:AIVEN_HOST } else { "" }),
  [int]$RemotePort = $(if ($env:AIVEN_PORT) { [int]$env:AIVEN_PORT } else { 0 }),
  [string]$RemoteUser = $(if ($env:AIVEN_USER) { $env:AIVEN_USER } else { "" }),
  [string]$RemoteDb = $(if ($env:AIVEN_DB_NAME) { $env:AIVEN_DB_NAME } else { "attendance" }),

  [switch]$IncludeSchema,
  [ValidateSet("IGNORE", "REPLACE", "ERROR")]
  [string]$OnConflict = "IGNORE"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$Name'. Ensure MySQL client tools are installed and on PATH."
  }
}

Require-Command "mysql"
Require-Command "mysqldump"

if ([string]::IsNullOrWhiteSpace($RemoteHost)) { throw "RemoteHost missing. Set env var AIVEN_HOST or pass -RemoteHost." }
if ($RemotePort -le 0) { throw "RemotePort missing. Set env var AIVEN_PORT or pass -RemotePort." }
if ([string]::IsNullOrWhiteSpace($RemoteUser)) { throw "RemoteUser missing. Set env var AIVEN_USER or pass -RemoteUser." }

function Read-EnvOrPromptPlain([string]$EnvName, [string]$Prompt) {
  $v = [Environment]::GetEnvironmentVariable($EnvName)
  if (-not [string]::IsNullOrWhiteSpace($v)) { return $v }
  return (Read-Host -Prompt $Prompt)
}

$localPass = Read-EnvOrPromptPlain "LOCAL_DB_PASS" "Enter LOCAL MySQL password for $LocalUser@$LocalHost"
$remotePass = Read-EnvOrPromptPlain "AIVEN_PASS" "Enter AIVEN MySQL password for $RemoteUser@$RemoteHost"

$tmpDir = Join-Path $PSScriptRoot ".tmp"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = Join-Path $tmpDir "attendance_dump_$stamp.sql"

$conflictArgs = @()
switch ($OnConflict) {
  "IGNORE" { $conflictArgs += "--insert-ignore" }
  "REPLACE" { $conflictArgs += "--replace" }
  "ERROR" { }
}

$dumpArgs = @(
  "--host=$LocalHost",
  "--port=$LocalPort",
  "--user=$LocalUser",
  "--password=$localPass",
  "--single-transaction",
  "--quick",
  "--routines",
  "--triggers",
  "--events",
  "--set-gtid-purged=OFF",
  "--no-tablespaces"
) + $conflictArgs

if (-not $IncludeSchema) {
  $dumpArgs += "--no-create-info"
}

$dumpArgs += $LocalDb

Write-Host "Dumping local '$LocalDb' to $dumpFile ..."
& mysqldump @dumpArgs | Out-File -FilePath $dumpFile -Encoding utf8

Write-Host "Ensuring remote database '$RemoteDb' exists ..."
$createDbSql = "CREATE DATABASE IF NOT EXISTS ``$RemoteDb``;"
& mysql "--host=$RemoteHost" "--port=$RemotePort" "--user=$RemoteUser" "--password=$remotePass" "--ssl-mode=REQUIRED" "--execute=$createDbSql" | Out-Null

Write-Host "Importing into remote '$RemoteDb' (ssl-mode=REQUIRED) ..."
Get-Content -Path $dumpFile | & mysql "--host=$RemoteHost" "--port=$RemotePort" "--user=$RemoteUser" "--password=$remotePass" "--ssl-mode=REQUIRED" "--database=$RemoteDb"

Write-Host "Done."
Write-Host "Dump kept at: $dumpFile"
