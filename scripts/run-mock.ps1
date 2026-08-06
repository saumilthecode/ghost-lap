$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw "Ghost Lap needs uv. Install it from https://docs.astral.sh/uv/getting-started/installation/ and run this launcher again; uv installs compatible Python if needed and downloads the locked dependencies."
}
$env:HITL2_MODE = "mock"
if (-not $env:HITL2_HOST) { $env:HITL2_HOST = "localhost" }
if (-not $env:HITL2_PORT) { $env:HITL2_PORT = "8788" }
if (-not $env:HITL2_OPEN_BROWSER) { $env:HITL2_OPEN_BROWSER = "1" }
if (-not $env:HITL2_DATA_DIR) {
    $env:HITL2_DATA_DIR = Join-Path $projectDir ".hitl2-mock"
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$administrator = [Security.Principal.WindowsBuiltInRole]::Administrator
if ($principal.IsInRole($administrator)) {
    throw "Practice mode does not need Administrator privileges. Reopen a normal PowerShell window."
}

Write-Warning "Mock mode uses a software key and is not hardware-backed."
uv sync --locked
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
uv run --no-sync hitl2
