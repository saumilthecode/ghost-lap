$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$env:HITL2_MODE = "hardware"
if (-not $env:HITL2_HOST) { $env:HITL2_HOST = "localhost" }
if (-not $env:HITL2_PORT) { $env:HITL2_PORT = "8788" }

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$administrator = [Security.Principal.WindowsBuiltInRole]::Administrator
if ($principal.IsInRole($administrator)) {
    if (-not (Test-Path (Join-Path $projectDir ".venv"))) {
        throw "Install dependencies once from a non-Administrator PowerShell first: uv sync --locked"
    }
    Write-Warning "Elevated mode expands the local broker's impact. Use it only on a trusted single-user machine, then stop it after the demo."
    uv run --offline --no-sync hitl2
    exit $LASTEXITCODE
} else {
    Write-Warning "Direct FIDO USB access is restricted on current Windows versions. If the key is not detected, reopen PowerShell as Administrator."
}

uv sync --locked
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
uv run --no-sync hitl2
