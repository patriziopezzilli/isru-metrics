# =====================================================
# ISRU METRICS DATABASE SETUP SCRIPT (PowerShell)
# Script di setup rapido per database PostgreSQL su Windows
# =====================================================

Write-Host "🚀 ISRU Metrics Database Setup (Windows)" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue

# Funzioni per log colorato
function Log-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Log-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Log-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Log-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Verifica prerequisiti
function Check-Dependencies {
    Log-Info "Checking dependencies..."
    
    # Verifica Docker
    try {
        $dockerVersion = docker --version 2>$null
        Log-Success "Docker found: $dockerVersion"
        $global:DockerAvailable = $true
    }
    catch {
        Log-Warning "Docker not found. Install from https://docs.docker.com/get-docker/"
        $global:DockerAvailable = $false
    }
    
    # Verifica Docker Compose
    try {
        $composeVersion = docker-compose --version 2>$null
        Log-Success "Docker Compose found: $composeVersion"
        $global:ComposeAvailable = $true
    }
    catch {
        Log-Warning "Docker Compose not found. Install from https://docs.docker.com/compose/install/"
        $global:ComposeAvailable = $false
    }
    
    # Verifica PostgreSQL locale (opzionale)
    try {
        $psqlVersion = psql --version 2>$null
        Log-Success "PostgreSQL client found: $psqlVersion"
        $global:PsqlAvailable = $true
    }
    catch {
        Log-Info "PostgreSQL client not found (optional)"
        $global:PsqlAvailable = $false
    }
    
    # Verifica Node.js
    try {
        $nodeVersion = node --version 2>$null
        Log-Success "Node.js found: $nodeVersion"
        $global:NodeAvailable = $true
    }
    catch {
        Log-Warning "Node.js not found. Install from https://nodejs.org/"
        $global:NodeAvailable = $false
    }
}

# Setup con Docker
function Setup-Docker {
    Log-Info "Setting up database with Docker..."
    
    # Crea file .env se non esiste
    if (-not (Test-Path ".env")) {
        Log-Info "Creating .env file from .env.example..."
        Copy-Item ".env.example" ".env"
        Log-Success ".env file created"
    }
    else {
        Log-Info ".env file already exists"
    }
    
    # Avvia containers
    Log-Info "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    # Attendi che il database sia pronto
    Log-Info "Waiting for database to be ready..."
    Start-Sleep -Seconds 10
    
    # Verifica connessione (PowerShell equivalente)
    try {
        $connectionTest = docker-compose exec postgres pg_isready -U postgres -d isru_metrics 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Database is ready!"
        }
        else {
            Log-Error "Database failed to start"
            return $false
        }
    }
    catch {
        Log-Error "Failed to test database connection"
        return $false
    }
    
    # Mostra informazioni connessione
    Write-Host ""
    Log-Success "Database setup completed!"
    Write-Host "================================" -ForegroundColor Blue
    Write-Host "🔗 Connection Details:" -ForegroundColor White
    Write-Host "   Host: localhost" -ForegroundColor Gray
    Write-Host "   Port: 5432" -ForegroundColor Gray
    Write-Host "   Database: isru_metrics" -ForegroundColor Gray
    Write-Host "   User: postgres" -ForegroundColor Gray
    Write-Host "   Password: postgres_dev_password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎯 pgAdmin (optional):" -ForegroundColor White
    Write-Host "   URL: http://localhost:8080" -ForegroundColor Gray
    Write-Host "   Email: admin@isru-metrics.local" -ForegroundColor Gray
    Write-Host "   Password: admin_password" -ForegroundColor Gray
    Write-Host ""
    
    return $true
}

# Setup manuale PostgreSQL
function Setup-Manual {
    Log-Info "Manual PostgreSQL setup instructions:"
    Write-Host "================================" -ForegroundColor Blue
    Write-Host "1. Install PostgreSQL:" -ForegroundColor White
    Write-Host "   - Download from https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "   - Or use Chocolatey: choco install postgresql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Create database:" -ForegroundColor White
    Write-Host "   createdb -U postgres isru_metrics" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Import schema:" -ForegroundColor White
    Write-Host "   psql -U postgres -d isru_metrics -f database\schema.sql" -ForegroundColor Gray
    Write-Host "   psql -U postgres -d isru_metrics -f database\migration.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Update .env file with your connection details" -ForegroundColor White
    Write-Host ""
}

# Installa dipendenze Node.js
function Install-NodeDependencies {
    if ($global:NodeAvailable) {
        Log-Info "Installing Node.js dependencies..."
        
        try {
            npm --version 2>$null | Out-Null
            npm install
            Log-Success "Node.js dependencies installed with npm"
        }
        catch {
            try {
                yarn --version 2>$null | Out-Null
                yarn install
                Log-Success "Node.js dependencies installed with Yarn"
            }
            catch {
                Log-Warning "No package manager found (npm/yarn)"
            }
        }
    }
    else {
        Log-Warning "Node.js not available, skipping dependency installation"
    }
}

# Test connessione database
function Test-Connection {
    Log-Info "Testing database connection..."
    
    if ($global:DockerAvailable -and $global:ComposeAvailable) {
        try {
            $result = docker-compose exec postgres pg_isready -U postgres -d isru_metrics 2>$null
            if ($LASTEXITCODE -eq 0) {
                Log-Success "Database connection test passed!"
            }
            else {
                Log-Error "Database connection test failed"
            }
        }
        catch {
            Log-Error "Failed to run connection test"
        }
    }
    else {
        Log-Info "Docker not available, skipping connection test"
        Log-Info "You can test manually with: psql -U postgres -h localhost -d isru_metrics"
    }
}

# Menu principale
function Show-MainMenu {
    Write-Host ""
    Log-Info "Choose setup method:"
    Write-Host "1) Docker setup (recommended)" -ForegroundColor White
    Write-Host "2) Manual PostgreSQL setup" -ForegroundColor White
    Write-Host "3) Install Node.js dependencies only" -ForegroundColor White
    Write-Host "4) Test database connection" -ForegroundColor White
    Write-Host "5) Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        1 {
            if ($global:DockerAvailable -and $global:ComposeAvailable) {
                $success = Setup-Docker
                if ($success) {
                    Install-NodeDependencies
                }
            }
            else {
                Log-Error "Docker or Docker Compose not available"
                Setup-Manual
            }
        }
        2 {
            Setup-Manual
            Install-NodeDependencies
        }
        3 {
            Install-NodeDependencies
        }
        4 {
            Test-Connection
        }
        5 {
            Log-Info "Goodbye!"
            exit 0
        }
        default {
            Log-Error "Invalid choice"
            Show-MainMenu
        }
    }
}

# Script principale
function Main {
    Write-Host ""
    Check-Dependencies
    Write-Host ""
    
    # Se Docker è disponibile, proponi setup automatico
    if ($global:DockerAvailable -and $global:ComposeAvailable) {
        $autoSetup = Read-Host "Do you want to start automatic Docker setup? (y/n)"
        if ($autoSetup -match "^[Yy]$") {
            $success = Setup-Docker
            if ($success) {
                Install-NodeDependencies
                Test-Connection
                
                Write-Host ""
                Log-Success "🎉 Setup completed!"
                Log-Info "You can now start developing with the database ready"
                Log-Info "Check DATABASE_README.md for usage examples"
                
                return
            }
        }
    }
    
    # Altrimenti mostra menu
    Show-MainMenu
}

# Avvia script
Main
