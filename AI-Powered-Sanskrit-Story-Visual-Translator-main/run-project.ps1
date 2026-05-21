param([switch]$Install, [switch]$Help)

if ($Help) {
    Write-Host "Usage: .\run-project.ps1 [options]"
    Write-Host "Options:"
    Write-Host "  -Install    Install dependencies and run"
    exit 0
}

$projectRoot = Get-Location
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Sanskrit Portal Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeExists = (Get-Command node -ErrorAction SilentlyContinue)
if ($nodeExists) {
    Write-Host "Node.js: OK" -ForegroundColor Green
} else {
    Write-Host "Node.js: NOT FOUND" -ForegroundColor Red
    Write-Host ""
    Write-Host "REQUIRED: Install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Check Python - try different commands
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    $testCmd = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($testCmd) {
        $pythonCmd = $cmd
        Write-Host "Python: OK" -ForegroundColor Green
        break
    }
}

if (-not $pythonCmd) {
    Write-Host "Python: NOT FOUND" -ForegroundColor Red
    Write-Host ""
    Write-Host "REQUIRED: Install Python from https://www.python.org/" -ForegroundColor Yellow
    Write-Host "During installation, CHECK: 'Add Python to PATH'" -ForegroundColor Yellow
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""

if ($Install) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Write-Host ""

    Write-Host "1. Backend setup..." -ForegroundColor Cyan
    Push-Location $backendDir
    
    if (-not (Test-Path "venv")) {
        Write-Host "   Creating venv..." -ForegroundColor Gray
        & cmd /c "$pythonCmd -m venv venv"
    }
    
    Write-Host "   Installing packages..." -ForegroundColor Gray
    & .\venv\Scripts\Activate.ps1
    & cmd /c "pip install -r requirements.txt"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "Ready" -ForegroundColor Green
    Pop-Location
    Write-Host ""

    Write-Host "2. Frontend setup..." -ForegroundColor Cyan
    Push-Location $frontendDir
    Write-Host "   Installing packages..." -ForegroundColor Gray
    & npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "Ready" -ForegroundColor Green
    Pop-Location
    Write-Host ""
}

Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "Backend starting..." -ForegroundColor Cyan
Push-Location $backendDir
& .\venv\Scripts\Activate.ps1
$backendCmd = "$pythonCmd -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; & '.\venv\Scripts\Activate.ps1'; $backendCmd"
Pop-Location
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Frontend starting..." -ForegroundColor Cyan
Push-Location $frontendDir
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm start"
Pop-Location

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Servers Started!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Login:     http://localhost:3000/login" -ForegroundColor Yellow
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Yellow
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000/login"
