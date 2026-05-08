param(
    [string]$PostgresPassword = "postgres",
    [int]$PostgresPort = 5432
)

$ErrorActionPreference = "Stop"
$BACKEND_DIR = Join-Path $PSScriptRoot "backend"
$FRONTEND_DIR = Join-Path $PSScriptRoot "frontend"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-OK {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    return Get-Command $Command -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
}

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  AI Airport Management System - Setup" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# ──────────────────────────────────────────────
# 1. Check Python
# ──────────────────────────────────────────────
Write-Step "1. Checking Python..."

$python = Test-Command "python"
if (-not $python) {
    Write-Fail "Python not found. Download from https://www.python.org/downloads/release/python-3128/"
    Write-Host "    Install Python 3.12+ and re-run this script." -ForegroundColor Yellow
    exit 1
}

$pyVer = python --version
Write-OK $pyVer

# ──────────────────────────────────────────────
# 2. Create & activate virtual env + install deps
# ──────────────────────────────────────────────
Write-Step "2. Setting up Python virtual environment..."

$venvPath = Join-Path $BACKEND_DIR "venv"
if (-not (Test-Path $venvPath)) {
    python -m venv $venvPath
    Write-OK "Virtual env created"
} else {
    Write-OK "Virtual env already exists"
}

$pip = Join-Path $venvPath "Scripts\pip.exe"
$pythonVenv = Join-Path $venvPath "Scripts\python.exe"

Write-Step "3. Installing backend Python packages..."
& $pip install -r (Join-Path $BACKEND_DIR "requirements.txt") --quiet
Write-OK "Packages installed"

# ──────────────────────────────────────────────
# 4. Check / Install PostgreSQL
# ──────────────────────────────────────────────
Write-Step "4. Checking PostgreSQL..."

$psql = Test-Command "psql"
if (-not $psql) {
    Write-Fail "PostgreSQL not found in PATH."
    Write-Host "    Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "    Install it (keep default port 5432), then re-run this script." -ForegroundColor Yellow
    Write-Host "    OR set up DB manually and edit backend/.env file." -ForegroundColor Yellow

    $choice = Read-Host "    Continue without PostgreSQL? [y/N]"
    if ($choice -ne "y") { exit 1 }
    Write-OK "Skipping PostgreSQL setup (you'll need to create DB manually)"
} else {
    Write-OK "PostgreSQL found: $((& $psql --version))"

    # Check if database exists, create if not
    $dbCheck = & $psql -U postgres -p $PostgresPort -t -c "SELECT 1 FROM pg_database WHERE datname='airport_mgmt'" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Could not connect to PostgreSQL. Check if service is running."
        Write-Host "    Run: Start-Service postgresql* (as Admin)" -ForegroundColor Yellow
    } else {
        if ([string]::IsNullOrEmpty($dbCheck.Trim())) {
            & $psql -U postgres -p $PostgresPort -c "CREATE DATABASE airport_mgmt" 2>$null
            Write-OK "Database 'airport_mgmt' created"
        } else {
            Write-OK "Database 'airport_mgmt' already exists"
        }

        # Write .env file
        $envFile = Join-Path $BACKEND_DIR ".env"
        if (-not (Test-Path $envFile)) {
            Set-Content -Path $envFile -Value "DATABASE_URL=postgresql://postgres:$PostgresPassword@localhost:$PostgresPort/airport_mgmt"
            Write-OK ".env file created"
        } else {
            Write-OK ".env file already exists"
        }
    }
}

# ──────────────────────────────────────────────
# 5. Train ML Models
# ──────────────────────────────────────────────
Write-Step "5. Training ML models..."
& $pythonVenv -m app.ml.train_models
if ($LASTEXITCODE -eq 0) {
    Write-OK "Models trained successfully"
} else {
    Write-Fail "Model training failed"
    exit 1
}

# ──────────────────────────────────────────────
# 6. Start backend server
# ──────────────────────────────────────────────
Write-Step "6. Starting backend server..."
$uvicorn = Join-Path $venvPath "Scripts\uvicorn.exe"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "  Starting API server on http://localhost:8000" -ForegroundColor Green
Write-Host "  Swagger docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server.`n" -ForegroundColor Yellow

Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d $BACKEND_DIR && $venvPath\Scripts\activate.bat && uvicorn app.main:app --reload" -NoNewWindow

Start-Sleep -Seconds 4
Write-Step "7. Checking API..."
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8000/" -ErrorAction Stop
    Write-OK "API running: $($res.message)"
} catch {
    Write-Fail "Could not reach API at http://localhost:8000"
    Write-Host "    Start manually: cd backend && venv\Scripts\activate && uvicorn app.main:app --reload" -ForegroundColor Yellow
}

Write-Host "`n--- Frontend Setup ---" -ForegroundColor Cyan
Write-Host "Run these commands in a new terminal:" -ForegroundColor White
Write-Host "  cd $FRONTEND_DIR" -ForegroundColor Yellow
Write-Host "  npm install" -ForegroundColor Yellow
Write-Host "  npm start" -ForegroundColor Yellow
