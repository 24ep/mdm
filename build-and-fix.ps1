# Build and fix script
$ErrorActionPreference = 'Continue'

Write-Host "Starting build process..." -ForegroundColor Green

# Run build and capture output
$buildOutput = @()
$process = Start-Process -FilePath "npm" -ArgumentList "run","build" -NoNewWindow -PassThru -RedirectStandardOutput "build-output.log" -RedirectStandardError "build-errors.log"

Write-Host "Build process started (PID: $($process.Id)). Waiting for completion..." -ForegroundColor Yellow

# Wait for process with timeout (10 minutes)
$process.WaitForExit(600000)

if (-not $process.HasExited) {
    Write-Host "Build timed out after 10 minutes. Killing process..." -ForegroundColor Red
    $process.Kill()
    exit 1
}

$exitCode = $process.ExitCode
$stdout = Get-Content "build-output.log" -ErrorAction SilentlyContinue
$stderr = Get-Content "build-errors.log" -ErrorAction SilentlyContinue

Write-Host "`n=== BUILD OUTPUT ===" -ForegroundColor Cyan
$stdout | ForEach-Object { Write-Host $_ }
if ($stderr) {
    Write-Host "`n=== BUILD ERRORS ===" -ForegroundColor Red
    $stderr | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

if ($exitCode -eq 0) {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nBuild failed with exit code: $exitCode" -ForegroundColor Red
    exit $exitCode
}


