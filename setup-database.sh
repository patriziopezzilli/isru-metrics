#!/bin/bash

# =====================================================
# ISRU METRICS DATABASE SETUP SCRIPT
# Script di setup rapido per database PostgreSQL
# =====================================================

echo "🚀 ISRU Metrics Database Setup"
echo "================================"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per log colorato
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Verifica prerequisiti
check_dependencies() {
    log_info "Checking dependencies..."
    
    # Verifica Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found. You can install it from https://docs.docker.com/get-docker/"
        DOCKER_AVAILABLE=false
    else
        log_success "Docker found"
        DOCKER_AVAILABLE=true
    fi
    
    # Verifica Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose not found. You can install it from https://docs.docker.com/compose/install/"
        COMPOSE_AVAILABLE=false
    else
        log_success "Docker Compose found"
        COMPOSE_AVAILABLE=true
    fi
    
    # Verifica PostgreSQL locale (opzionale)
    if command -v psql &> /dev/null; then
        log_success "PostgreSQL client found"
        PSQL_AVAILABLE=true
    else
        log_info "PostgreSQL client not found (optional)"
        PSQL_AVAILABLE=false
    fi
    
    # Verifica Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js found: $NODE_VERSION"
        NODE_AVAILABLE=true
    else
        log_warning "Node.js not found. Install from https://nodejs.org/"
        NODE_AVAILABLE=false
    fi
}

# Setup con Docker
setup_docker() {
    log_info "Setting up database with Docker..."
    
    # Crea file .env se non esiste
    if [ ! -f ".env" ]; then
        log_info "Creating .env file from .env.example..."
        cp .env.example .env
        log_success ".env file created"
    else
        log_info ".env file already exists"
    fi
    
    # Avvia containers
    log_info "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    # Attendi che il database sia pronto
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Verifica connessione
    if docker-compose exec postgres pg_isready -U postgres -d isru_metrics; then
        log_success "Database is ready!"
    else
        log_error "Database failed to start"
        return 1
    fi
    
    # Mostra informazioni connessione
    echo ""
    log_success "Database setup completed!"
    echo "================================"
    echo "🔗 Connection Details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: isru_metrics"
    echo "   User: postgres"
    echo "   Password: postgres_dev_password"
    echo ""
    echo "🎯 pgAdmin (optional):"
    echo "   URL: http://localhost:8080"
    echo "   Email: admin@isru-metrics.local"
    echo "   Password: admin_password"
    echo ""
}

# Setup manuale PostgreSQL
setup_manual() {
    log_info "Manual PostgreSQL setup instructions:"
    echo "================================"
    echo "1. Install PostgreSQL:"
    echo "   - Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   - macOS: brew install postgresql"
    echo "   - Windows: Download from https://www.postgresql.org/download/"
    echo ""
    echo "2. Create database:"
    echo "   sudo -u postgres createdb isru_metrics"
    echo ""
    echo "3. Import schema:"
    echo "   psql -U postgres -d isru_metrics -f database/schema.sql"
    echo "   psql -U postgres -d isru_metrics -f database/migration.sql"
    echo ""
    echo "4. Update .env file with your connection details"
    echo ""
}

# Installa dipendenze Node.js
install_node_deps() {
    if [ "$NODE_AVAILABLE" = true ]; then
        log_info "Installing Node.js dependencies..."
        
        if command -v npm &> /dev/null; then
            npm install
            log_success "Node.js dependencies installed"
        elif command -v yarn &> /dev/null; then
            yarn install
            log_success "Node.js dependencies installed with Yarn"
        else
            log_warning "No package manager found (npm/yarn)"
        fi
    else
        log_warning "Node.js not available, skipping dependency installation"
    fi
}

# Test connessione database
test_connection() {
    log_info "Testing database connection..."
    
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        if docker-compose exec postgres pg_isready -U postgres -d isru_metrics; then
            log_success "Database connection test passed!"
        else
            log_error "Database connection test failed"
        fi
    else
        log_info "Docker not available, skipping connection test"
        log_info "You can test manually with: psql -U postgres -h localhost -d isru_metrics"
    fi
}

# Menu principale
main_menu() {
    echo ""
    log_info "Choose setup method:"
    echo "1) Docker setup (recommended)"
    echo "2) Manual PostgreSQL setup"
    echo "3) Install Node.js dependencies only"
    echo "4) Test database connection"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
                setup_docker
                install_node_deps
            else
                log_error "Docker or Docker Compose not available"
                setup_manual
            fi
            ;;
        2)
            setup_manual
            install_node_deps
            ;;
        3)
            install_node_deps
            ;;
        4)
            test_connection
            ;;
        5)
            log_info "Goodbye!"
            exit 0
            ;;
        *)
            log_error "Invalid choice"
            main_menu
            ;;
    esac
}

# Script principale
main() {
    echo ""
    check_dependencies
    echo ""
    
    # Se Docker è disponibile, proponi setup automatico
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        read -p "Do you want to start automatic Docker setup? (y/n): " auto_setup
        if [[ $auto_setup =~ ^[Yy]$ ]]; then
            setup_docker
            install_node_deps
            test_connection
            
            echo ""
            log_success "🎉 Setup completed!"
            log_info "You can now start developing with the database ready"
            log_info "Check DATABASE_README.md for usage examples"
            
            return 0
        fi
    fi
    
    # Altrimenti mostra menu
    main_menu
}

# Avvia script
main "$@"
