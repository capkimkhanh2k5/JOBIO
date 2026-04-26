#!/bin/bash

###############################################################################
# JOBIO DATABASE RESET & DATA IMPORT SCRIPT
# 
# Purpose: Xóa dữ liệu cũ và import dữ liệu mới hoàn chỉnh
# Usage: ./loadData.sh [options]
# 
# Options:
#   --help              Hiển thị hướng dẫn
#   --dry-run          Chỉ xem kế hoạch, không thực hiện
#   --no-backup        Không backup database (không khuyến cáo)
#   --verbose          Hiển thị chi tiết mỗi bước
#
# Example:
#   ./loadData.sh              # Load bình thường
#   ./loadData.sh --dry-run    # Xem kế hoạch trước
#   ./loadData.sh --verbose    # Xem chi tiết
###############################################################################

set -e  # Exit on error

# ============================================================================
# CONFIG
# ============================================================================

# Project paths
PROJECT_ROOT="/Users/capkimkhanh/Documents/DUT/JOBIO"
BACKEND_DIR="$PROJECT_ROOT/backend"
DATA_DIR="$PROJECT_ROOT/DataSet"

# Auto-detect data directory (prefer Data_Final_FIXED, fallback to Data_Final)
if [ -d "$DATA_DIR/Data_Final_FIXED" ]; then
    DATA_FIXED_DIR="$DATA_DIR/Data_Final_FIXED"
elif [ -d "$DATA_DIR/Data_Final" ]; then
    DATA_FIXED_DIR="$DATA_DIR/Data_Final"
else
    DATA_FIXED_DIR="$DATA_DIR/Data_Final_FIXED"  # Will error in prerequisite check
fi

BACKUP_DIR="$PROJECT_ROOT/database_backups"

# Database config (from Django settings)
DB_NAME="jobportal_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5433"

# Detect Python command (prefer venv)
if [ -f "$BACKEND_DIR/.venv/bin/python3" ]; then
    PYTHON_CMD="$BACKEND_DIR/.venv/bin/python3"
elif [ -f "$PROJECT_ROOT/.venv/bin/python3" ]; then
    PYTHON_CMD="$PROJECT_ROOT/.venv/bin/python3"
else
    PYTHON_CMD="python3"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
VERBOSE=0
DRY_RUN=0
SKIP_BACKUP=0

# ============================================================================
# FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

verbose_log() {
    if [ $VERBOSE -eq 1 ]; then
        echo -e "${BLUE}  $1${NC}"
    fi
}

show_help() {
    echo ""
    echo "📋 JOBIO DATABASE RESET & DATA IMPORT"
    echo ""
    echo "Usage: ./loadData.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --dry-run       Simulate what will happen (don't actually do it)"
    echo "  --no-backup     Skip database backup (not recommended)"
    echo "  --verbose       Show detailed output"
    echo ""
    echo "Examples:"
    echo "  ./loadData.sh                  # Normal import"
    echo "  ./loadData.sh --dry-run        # See what will happen"
    echo "  ./loadData.sh --verbose        # Detailed output"
    echo "  ./loadData.sh --no-backup      # Skip backup (⚠️ careful!)"
    echo ""
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --dry-run)
                DRY_RUN=1
                log_warn "Running in DRY-RUN mode (no changes will be made)"
                shift
                ;;
            --no-backup)
                SKIP_BACKUP=1
                log_warn "Skipping database backup"
                shift
                ;;
            --verbose)
                VERBOSE=1
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

check_prerequisites() {
    log_section "📋 CHECKING PREREQUISITES"
    
    log_info "Using data directory: $DATA_FIXED_DIR"
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    verbose_log "✓ Backend directory found"
    
    # Check if data directory exists
    if [ ! -d "$DATA_FIXED_DIR" ]; then
        log_error "Data directory not found: $DATA_FIXED_DIR"
        log_info ""
        log_info "Available directories:"
        log_info "  - $DATA_DIR/Data_Final (if exists)"
        log_info "  - $DATA_DIR/Data_Final_FIXED (if exists)"
        log_info ""
        log_info "Please create one of these with your JSON files"
        exit 1
    fi
    verbose_log "✓ Data directory found: $DATA_FIXED_DIR"
    
    # Check if manage.py exists
    if [ ! -f "$BACKEND_DIR/manage.py" ]; then
        log_error "manage.py not found: $BACKEND_DIR/manage.py"
        exit 1
    fi
    verbose_log "✓ manage.py found"
    
    # Check if Python is available
    if ! command -v $PYTHON_CMD &> /dev/null; then
        log_error "Python command not found: $PYTHON_CMD"
        exit 1
    fi
    verbose_log "✓ Python available: $PYTHON_CMD"
    
    # Check if postgres is available (for backup)
    if [ $SKIP_BACKUP -eq 0 ] && ! command -v pg_dump &> /dev/null; then
        log_warn "pg_dump not found - will skip backup"
        SKIP_BACKUP=1
    fi
    
    # Check data files
    required_files=(
        "users.json"
        "addresses.json"
        "industries.json"
        "companies.json"
        "jobs.json"
        "applications.json"
        "transactions.json"
        "company_subscriptions.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$DATA_FIXED_DIR/$file" ]; then
            log_error "Required data file not found: $file"
            exit 1
        fi
        verbose_log "✓ $file exists"
    done
    
    log_success "All prerequisites checked ✓"
}

backup_database() {
    if [ $SKIP_BACKUP -eq 1 ]; then
        log_warn "Skipping database backup (as requested)"
        return 0
    fi
    
    log_section "💾 BACKING UP DATABASE"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/jobio_db_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ $DRY_RUN -eq 0 ]; then
        verbose_log "Creating backup: $BACKUP_FILE"
        
        if pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" > "$BACKUP_FILE"; then
            log_success "Database backed up to: $BACKUP_FILE"
        else
            log_error "Failed to backup database"
            exit 1
        fi
    else
        log_info "(DRY-RUN) Would backup to: $BACKUP_FILE"
    fi
}

flush_database() {
    log_section "🗑️  FLUSHING OLD DATA"
    
    log_warn "This will DELETE all data from the database!"
    
    if [ $DRY_RUN -eq 0 ]; then
        # Prompt for confirmation
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" != "yes" ]; then
            log_error "Cancelled by user"
            exit 1
        fi
        
        cd "$BACKEND_DIR"
        
        verbose_log "Running: DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME $PYTHON_CMD manage.py flush --no-input"
        
        if DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME $PYTHON_CMD manage.py flush --no-input 2>&1 | grep -q "Flushed"; then
            log_success "Database flushed successfully"
        else
            log_warn "Failed to flush database (tables might be empty or have complex constraints)"
            log_info "Proceeding with incremental import (custom loader will update existing records)"
        fi
    else
        log_info "(DRY-RUN) Would flush database after confirmation"
    fi
}

import_data() {
    log_section "📥 IMPORTING DATA"
    
    cd "$BACKEND_DIR"
    
    if [ $DRY_RUN -eq 0 ]; then
        log_info "Running custom loader: load_seed_data.py"
        
        # Run the custom loader script
        # We pass the data directory as an argument
        OUTPUT=$(DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME $PYTHON_CMD scripts/load_seed_data.py "$DATA_FIXED_DIR" 2>&1)
        EXIT_CODE=$?
        
        # Show output in verbose mode
        if [ $VERBOSE -eq 1 ]; then
            echo -e "$OUTPUT"
        fi
        
        # Check for [ERROR] in output or non-zero exit code
        if echo "$OUTPUT" | grep -q "\[ERROR\]" || [ $EXIT_CODE -ne 0 ]; then
            echo -e "${RED}FAILED${NC}"
            log_error "Import failed with [ERROR] from loader"
            if [ $VERBOSE -eq 0 ]; then
                # Show errors even if not verbose
                echo -e "$OUTPUT" | grep "\[ERROR\]"
            fi
            exit 1
        fi
        
        log_success "Custom loader completed successfully"
    else
        log_info "(DRY-RUN) Would run load_seed_data.py on $DATA_FIXED_DIR"
    fi
}

sync_sequences() {
    log_section "🔄 SYNCHRONIZING DATABASE SEQUENCES"
    
    cd "$BACKEND_DIR"
    
    if [ $DRY_RUN -eq 1 ]; then
        log_info "(DRY-RUN) Skipping sequence synchronization"
        return 0
    fi
    
    DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME $PYTHON_CMD << 'EOF'
import os
import sys
import django
from django.core.management.color import no_style

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.apps import apps

statements_executed = 0
with connection.cursor() as cursor:
    for app_config in apps.get_app_configs():
        if app_config.models_module is not None:
            statements = connection.ops.sequence_reset_sql(no_style(), app_config.get_models())
            for statement in statements:
                cursor.execute(statement)
                statements_executed += 1
print(f"\n✅ Synchronized PostgreSQL sequences. Executed {statements_executed} statements.\n")
EOF
}

verify_data() {
    log_section "✅ VERIFYING IMPORTED DATA"
    
    cd "$BACKEND_DIR"
    
    if [ $DRY_RUN -eq 1 ]; then
        log_info "(DRY-RUN) Skipping verification"
        return 0
    fi
    
    DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME $PYTHON_CMD << 'EOF'
import os
import sys
import django

# Add current directory to sys.path to ensure apps are discoverable
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.billing.models import Transaction
from apps.candidate.recruiters.models import Recruiter

print("\n📊 Data Verification Results:\n")

counts = {
    "Users": CustomUser.objects.count(),
    "Companies": Company.objects.count(),
    "Jobs": Job.objects.count(),
    "Applications": Application.objects.count(),
    "Recruiters": Recruiter.objects.count(),
    "Transactions": Transaction.objects.count(),
}

for model, count in counts.items():
    status = "✓" if count > 0 else "⚠"
    print(f"  {status} {model}: {count} records")

# Check for any major issues
if counts["Users"] == 0:
    print("\n  ⚠️  WARNING: No users found!")
if counts["Companies"] == 0:
    print("\n  ⚠️  WARNING: No companies found!")
if counts["Jobs"] == 0:
    print("\n  ⚠️  WARNING: No jobs found!")

print("")
EOF
}

generate_report() {
    log_section "📋 IMPORT REPORT"
    
    REPORT_FILE="$DATA_DIR/LOAD_REPORT_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=========================================="
        echo "JOBIO DATABASE IMPORT REPORT"
        echo "=========================================="
        echo ""
        echo "Timestamp: $(date)"
        echo "Backend Directory: $BACKEND_DIR"
        echo "Data Directory: $DATA_FIXED_DIR"
        echo ""
        echo "Options Used:"
        echo "  - Dry Run: $([ $DRY_RUN -eq 1 ] && echo 'YES' || echo 'NO')"
        echo "  - Backup Skipped: $([ $SKIP_BACKUP -eq 1 ] && echo 'YES' || echo 'NO')"
        echo "  - Verbose: $([ $VERBOSE -eq 1 ] && echo 'YES' || echo 'NO')"
        echo ""
        echo "Status: $([ $DRY_RUN -eq 1 ] && echo 'DRY-RUN (no changes made)' || echo 'COMPLETED')"
        echo ""
        echo "=========================================="
    } > "$REPORT_FILE"
    
    log_success "Report saved to: $REPORT_FILE"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log_section "🚀 JOBIO DATABASE RESET & DATA IMPORT"
    
    parse_args "$@"
    
    check_prerequisites
    backup_database
    flush_database
    import_data
    sync_sequences
    verify_data
    generate_report
    
    echo ""
    log_section "✨ ALL DONE!"
    
    if [ $DRY_RUN -eq 1 ]; then
        log_warn "This was a DRY-RUN. No actual changes were made."
        echo ""
        log_info "To execute the actual import, run:"
        echo "  ./loadData.sh"
    else
        log_success "Database has been reset and new data imported successfully!"
        echo ""
        log_info "Next steps:"
        echo "  1. Verify data in admin panel: http://localhost:8000/admin"
        echo "  2. Run tests: python manage.py test"
        echo "  3. Start server: python manage.py runserver"
    fi
    
    echo ""
}

# Run main function
main "$@"
