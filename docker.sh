#!/bin/bash

# ─────────────────────────────────────────────────────────────────
# Weats Backend - Docker Compose Management Script
# ─────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────
# Functions
# ─────────────────────────────────────────────────────────────────

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_env() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        echo "Please copy .env.example to .env and fill in your values:"
        echo "  cp .env.example .env"
        exit 1
    fi
    print_success ".env file found"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker and Docker Compose are installed"
}

# ─────────────────────────────────────────────────────────────────
# Commands
# ─────────────────────────────────────────────────────────────────

cmd_start() {
    print_header "Starting Weats Backend Services"
    
    check_env
    check_docker
    
    print_warning "Building Docker images..."
    docker-compose build
    
    print_warning "Starting services..."
    docker-compose up -d
    
    print_success "Services started!"
    echo ""
    cmd_status
}

cmd_stop() {
    print_header "Stopping Weats Backend Services"
    docker-compose stop
    print_success "Services stopped"
}

cmd_down() {
    print_header "Stopping and Removing Containers"
    docker-compose down
    print_success "Containers removed (volumes preserved)"
}

cmd_down_volumes() {
    print_header "WARNING: Stopping and Removing EVERYTHING"
    read -p "This will DELETE all data! Are you sure? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
        docker-compose down -v
        print_success "All containers and volumes removed"
    else
        print_warning "Cancelled"
    fi
}

cmd_status() {
    print_header "Service Status"
    docker-compose ps
}

cmd_logs() {
    if [ -z "$2" ]; then
        print_header "Logs - All Services"
        docker-compose logs -f --tail=100
    else
        print_header "Logs - $2"
        docker-compose logs -f --tail=100 "$2"
    fi
}

cmd_build() {
    print_header "Building Docker Images"
    docker-compose build
    print_success "Build completed"
}

cmd_rebuild() {
    print_header "Rebuilding Docker Images (no cache)"
    docker-compose build --no-cache
    print_success "Rebuild completed"
}

cmd_health() {
    print_header "Health Check Status"
    
    echo "Gateway 1: $(docker inspect --format='{{.State.Health.Status}}' weats-gateway-1 2>/dev/null || echo 'N/A')"
    echo "Gateway 2: $(docker inspect --format='{{.State.Health.Status}}' weats-gateway-2 2>/dev/null || echo 'N/A')"
    echo "Gateway 3: $(docker inspect --format='{{.State.Health.Status}}' weats-gateway-3 2>/dev/null || echo 'N/A')"
    echo "Webhooks: $(docker inspect --format='{{.State.Health.Status}}' weats-webhooks 2>/dev/null || echo 'N/A')"
    echo "PostgreSQL Core: $(docker inspect --format='{{.State.Health.Status}}' weats-postgres-core 2>/dev/null || echo 'N/A')"
    echo "PostgreSQL Orders: $(docker inspect --format='{{.State.Health.Status}}' weats-postgres-orders 2>/dev/null || echo 'N/A')"
    echo "Redis: $(docker inspect --format='{{.State.Health.Status}}' weats-redis 2>/dev/null || echo 'N/A')"
    echo "Nginx: $(docker inspect --format='{{.State.Health.Status}}' weats-nginx 2>/dev/null || echo 'N/A')"
}

cmd_test_api() {
    print_header "Testing API"
    
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Services are not running"
        return 1
    fi
    
    echo "Testing health endpoint..."
    if curl -f http://localhost/health 2>/dev/null; then
        print_success "API is healthy"
    else
        print_error "API health check failed"
    fi
}

cmd_test_db() {
    print_header "Testing Database Connections"
    
    echo "Testing PostgreSQL Core..."
    docker exec weats-postgres-core pg_isready -U postgres && print_success "PostgreSQL Core is ready" || print_error "PostgreSQL Core connection failed"
    
    echo ""
    echo "Testing PostgreSQL Orders..."
    docker exec weats-postgres-orders pg_isready -U postgres && print_success "PostgreSQL Orders is ready" || print_error "PostgreSQL Orders connection failed"
    
    echo ""
    echo "Testing Redis..."
    docker exec weats-redis redis-cli -a $(grep REDIS_PASSWORD .env | cut -d '=' -f2) ping > /dev/null && print_success "Redis is ready" || print_error "Redis connection failed"
}

cmd_prune() {
    print_header "Cleaning Up Unused Docker Resources"
    read -p "Remove unused containers, images, and networks? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
        docker system prune -a --volumes
        print_success "Cleanup completed"
    else
        print_warning "Cancelled"
    fi
}

cmd_backup_db() {
    print_header "Backing Up Databases"
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    echo "Backing up PostgreSQL Core..."
    docker exec weats-postgres-core pg_dump -U postgres core > "$BACKUP_DIR/core_$TIMESTAMP.sql"
    print_success "Core database backed up: core_$TIMESTAMP.sql"
    
    echo ""
    echo "Backing up PostgreSQL Orders..."
    docker exec weats-postgres-orders pg_dump -U postgres orders-db > "$BACKUP_DIR/orders_$TIMESTAMP.sql"
    print_success "Orders database backed up: orders_$TIMESTAMP.sql"
    
    echo ""
    echo "Total backups:"
    ls -lh "$BACKUP_DIR"
}

cmd_restart() {
    print_header "Restarting Services"
    
    SERVICE=$2
    if [ -z "$SERVICE" ]; then
        docker-compose restart
        print_success "All services restarted"
    else
        docker-compose restart "$SERVICE"
        print_success "$SERVICE restarted"
    fi
}

cmd_help() {
    cat << EOF
${BLUE}Weats Backend - Docker Compose Management${NC}

${GREEN}USAGE:${NC}
  ./docker.sh <command> [options]

${GREEN}COMMANDS:${NC}
  start              Start all services
  stop               Stop all services (containers preserved)
  down               Stop and remove containers (volumes preserved)
  down-volumes       Stop and remove EVERYTHING (⚠️ DELETES ALL DATA)
  
  status             Show service status
  logs [service]     Show logs (all or specific service)
  health             Show health check status
  
  build              Build Docker images
  rebuild            Rebuild images (no cache)
  
  restart [service]  Restart services (all or specific)
  
  test-api           Test API health endpoint
  test-db            Test database connections
  
  backup-db          Backup PostgreSQL databases
  
  prune              Clean up unused Docker resources
  
  help               Show this help message

${GREEN}EXAMPLES:${NC}
  ./docker.sh start                    # Start all services
  ./docker.sh logs gateway1            # Show gateway1 logs
  ./docker.sh logs -f webhooks         # Follow webhooks logs
  ./docker.sh restart gateway2         # Restart gateway2
  ./docker.sh test-api                 # Test API
  ./docker.sh backup-db                # Backup databases

EOF
}

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

main() {
    if [ $# -eq 0 ]; then
        cmd_help
        exit 1
    fi
    
    case "$1" in
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        down)
            cmd_down
            ;;
        down-volumes)
            cmd_down_volumes
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs "$@"
            ;;
        health)
            cmd_health
            ;;
        build)
            cmd_build
            ;;
        rebuild)
            cmd_rebuild
            ;;
        restart)
            cmd_restart "$@"
            ;;
        test-api)
            cmd_test_api
            ;;
        test-db)
            cmd_test_db
            ;;
        prune)
            cmd_prune
            ;;
        backup-db)
            cmd_backup_db
            ;;
        help)
            cmd_help
            ;;
        *)
            print_error "Unknown command: $1"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
