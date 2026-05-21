#!/bin/bash

###############################################################################
# JOBIO DATABASE RESET & DATA IMPORT SCRIPT (UNIFIED & ADVANCED)
# 
# Purpose: Xóa dữ liệu cũ và import dữ liệu mới hoàn chỉnh.
#          Hỗ trợ đa nền tảng (Windows Git Bash, macOS, Linux).
# Usage: ./loadData.sh [options]
# 
# Options:
#   --help              Hiển thị hướng dẫn
#   --dry-run          Chỉ xem kế hoạch, không thực hiện
#   --no-backup        Không backup database (không khuyến cáo)
#   --verbose          Hiển thị chi tiết mỗi bước
#
###############################################################################

set -e  # Dừng script nếu có lỗi

# Cấu hình UTF-8 cho Windows Git Bash để hiển thị tiếng Việt không bị lỗi
export PYTHONUTF8=1
export PYTHONIOENCODING=utf-8

# ============================================================================
# 1. PHÁT HIỆN ĐƯỜNG DẪN DỰ ÁN (DYNAMIC PATH DETECTION)
# ============================================================================

# Lấy đường dẫn tuyệt đối của thư mục chứa script này (DataSet/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Thư mục gốc của dự án là thư mục cha của DataSet/
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

BACKEND_DIR="$PROJECT_ROOT/backend"
DATA_DIR="$PROJECT_ROOT/DataSet"
BACKUP_DIR="$DATA_DIR/database_backups"

# Tự động phát hiện thư mục dữ liệu (ưu tiên Data_Final_FIXED)
if [ -d "$DATA_DIR/Data_Final_FIXED" ]; then
    DATA_FIXED_DIR="$DATA_DIR/Data_Final_FIXED"
elif [ -d "$DATA_DIR/Data_Final" ]; then
    DATA_FIXED_DIR="$DATA_DIR/Data_Final"
else
    DATA_FIXED_DIR="$DATA_DIR/Data_Final_FIXED" # Sẽ báo lỗi ở bước kiểm tra prerequisites
fi

# ============================================================================
# 2. CẤU HÌNH DATABASE & PYTHON
# ============================================================================

# Cấu hình Database mặc định (Có thể ghi đè bằng biến môi trường)
DB_NAME=${DB_NAME:-"jobportal_db"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5433"}

# Tự động phát hiện lệnh Python (Hỗ trợ cả Windows venv và Unix venv)
if [ -f "$BACKEND_DIR/venv/Scripts/python.exe" ]; then
    PYTHON_CMD="$BACKEND_DIR/venv/Scripts/python.exe"
elif [ -f "$BACKEND_DIR/.venv/Scripts/python.exe" ]; then
    PYTHON_CMD="$BACKEND_DIR/.venv/Scripts/python.exe"
elif [ -f "$PROJECT_ROOT/.venv/Scripts/python.exe" ]; then
    PYTHON_CMD="$PROJECT_ROOT/.venv/Scripts/python.exe"
elif [ -f "$BACKEND_DIR/venv/bin/python3" ]; then
    PYTHON_CMD="$BACKEND_DIR/venv/bin/python3"
elif [ -f "$BACKEND_DIR/venv/bin/python3.11" ]; then
    PYTHON_CMD="$BACKEND_DIR/venv/bin/python3.11"
elif [ -f "$BACKEND_DIR/.venv/bin/python3" ]; then
    PYTHON_CMD="$BACKEND_DIR/.venv/bin/python3"
elif [ -f "$BACKEND_DIR/.venv/bin/python3.11" ]; then
    PYTHON_CMD="$BACKEND_DIR/.venv/bin/python3.11"
elif [ -f "$PROJECT_ROOT/.venv/bin/python3" ]; then
    PYTHON_CMD="$PROJECT_ROOT/.venv/bin/python3"
elif [ -f "$PROJECT_ROOT/.venv/bin/python3.11" ]; then
    PYTHON_CMD="$PROJECT_ROOT/.venv/bin/python3.11"
else
    PYTHON_CMD="python3"
    # Kiểm tra nếu python3 không tồn tại thì thử dùng python
    if ! command -v python3 &> /dev/null; then
        PYTHON_CMD="python"
    fi
fi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags mặc định
VERBOSE=0
DRY_RUN=0
SKIP_BACKUP=0

# ============================================================================
# 3. CÁC HÀM TIỆN ÍCH
# ============================================================================

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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
    echo "Sử dụng: ./loadData.sh [OPTIONS]"
    echo ""
    echo "Tùy chọn:"
    echo "  --help          Hiển thị hướng dẫn này"
    echo "  --dry-run       Mô phỏng quá trình (không thay đổi dữ liệu thật)"
    echo "  --no-backup     Bỏ qua bước backup database"
    echo "  --verbose       Hiển thị chi tiết từng câu lệnh thực hiện"
    echo ""
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help) show_help; exit 0 ;;
            --dry-run) DRY_RUN=1; log_warn "Chế độ DRY-RUN: Sẽ không có thay đổi nào được thực hiện."; shift ;;
            --no-backup) SKIP_BACKUP=1; log_warn "Đã tắt chế độ backup database."; shift ;;
            --verbose) VERBOSE=1; shift ;;
            *) log_error "Tùy chọn không hợp lệ: $1"; show_help; exit 1 ;;
        esac
    done
}

# ============================================================================
# 4. KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT
# ============================================================================

check_prerequisites() {
    log_section "📋 KIỂM TRA HỆ THỐNG"
    
    verbose_log "PROJECT_ROOT: $PROJECT_ROOT"
    log_info "Sử dụng thư mục dữ liệu: $DATA_FIXED_DIR"
    
    # Kiểm tra thư mục backend
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Không tìm thấy thư mục backend: $BACKEND_DIR"
        exit 1
    fi
    
    # Kiểm tra thư mục dữ liệu JSON
    if [ ! -d "$DATA_FIXED_DIR" ]; then
        log_error "Không tìm thấy thư mục chứa file JSON: $DATA_FIXED_DIR"
        exit 1
    fi
    
    # Kiểm tra Python
    if ! "$PYTHON_CMD" --version &> /dev/null; then
        log_error "Lệnh Python không hoạt động: $PYTHON_CMD"
        exit 1
    fi
    verbose_log "✓ Python: $($PYTHON_CMD --version)"
    
    # Kiểm tra pg_dump (nếu cần backup)
    if [ $SKIP_BACKUP -eq 0 ] && ! command -v pg_dump &> /dev/null; then
        log_warn "Không tìm thấy lệnh pg_dump. Sẽ bỏ qua bước backup."
        SKIP_BACKUP=1
    fi
    
    # Kiểm tra các file JSON bắt buộc
    required_files=(
        "users.json" "addresses.json" "industries.json" 
        "companies.json" "jobs.json" "applications.json" 
        "transactions.json" "company_subscriptions.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$DATA_FIXED_DIR/$file" ]; then
            log_error "Thiếu file dữ liệu bắt buộc: $file"
            exit 1
        fi
    done
    
    log_success "Kiểm tra hệ thống hoàn tất ✓"
}

# ============================================================================
# 5. XỬ LÝ DỮ LIỆU & DATABASE
# ============================================================================

validate_unique_seed_data() {
    log_section "🔎 KIỂM TRA TÍNH DUY NHẤT CỦA DỮ LIỆU (SEED DATA)"
    
    # Chạy script Python nhỏ để kiểm tra trùng lặp slug, id...
    set +e
    UNIQUE_OUTPUT=$(DATA_FIXED_DIR="$DATA_FIXED_DIR" "$PYTHON_CMD" 2>&1 << 'EOF'
import json, os, sys
from collections import defaultdict
from pathlib import Path

data_dir = Path(os.environ["DATA_FIXED_DIR"])
checks = [
    ("jobs.json", ("slug",), None),
    ("recruiter_languages.json", ("recruiter_id", "language_id"), None),
    ("company_subscriptions.json", ("company_id",), lambda row: row.get("status") == "active"),
    ("saved_jobs.json", ("recruiter_id", "job_id"), None),
    ("job_locations.json", ("job_id", "address_id"), None),
    ("user_passkeys.json", ("credential_id",), None),
]

errors = []
for filename, fields, predicate in checks:
    path = data_dir / filename
    if not path.exists(): continue
    with path.open("r", encoding="utf-8-sig") as h:
        rows = json.load(h)
    groups = defaultdict(list)
    for row in rows:
        if predicate and not predicate(row): continue
        key = tuple(row.get(f) for f in fields)
        groups[key].append(row.get("id"))
    for key, ids in groups.items():
        if len(ids) > 1:
            errors.append(f"{filename}: fields={fields}, value={key}, ids={ids}")

if errors:
    print("[ERROR] Tìm thấy dữ liệu trùng lặp:")
    for e in errors: print(f"  - {e}")
    sys.exit(1)
print("Dữ liệu seed hợp lệ (không trùng lặp).")
EOF
)
    EXIT_CODE=$?
    set -e

    if [ $EXIT_CODE -ne 0 ]; then
        log_error "Dữ liệu JSON bị trùng lặp. Vui lòng sửa trước khi import."
        echo -e "$UNIQUE_OUTPUT"
        exit 1
    fi
    log_success "Kiểm tra tính duy nhất hoàn tất."
}

backup_database() {
    if [ $SKIP_BACKUP -eq 1 ]; then return 0; fi
    
    log_section "💾 ĐANG SAO LƯU DATABASE"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/jobio_db_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ $DRY_RUN -eq 0 ]; then
        mkdir -p "$BACKUP_DIR"
        if PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" > "$BACKUP_FILE"; then
            log_success "Đã lưu backup tại: $BACKUP_FILE"
        else
            log_error "Lỗi khi backup database."
            exit 1
        fi
    else
        log_info "(DRY-RUN) Sẽ backup vào: $BACKUP_FILE"
    fi
}

truncate_all_public_tables() {
    log_warn "Đang thực hiện xóa bảng bằng SQL trực tiếp (CASCADE)..."
    set +e
    TRUNCATE_OUTPUT=$(DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME "$PYTHON_CMD" 2>&1 << 'EOF'
import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'django_migrations'")
    tables = [row[0] for row in cursor.fetchall()]
    if tables:
        quoted_tables = ', '.join(connection.ops.quote_name(t) for t in tables)
        cursor.execute(f"TRUNCATE {quoted_tables} RESTART IDENTITY CASCADE;")
        print(f"Đã xóa dữ liệu {len(tables)} bảng.")
EOF
)
    EXIT_CODE=$?
    set -e
    if [ $EXIT_CODE -eq 0 ]; then log_success "Xóa dữ liệu thành công."; else log_error "Lỗi xóa bảng."; echo "$TRUNCATE_OUTPUT"; exit 1; fi
}

flush_database() {
    log_section "🗑️  XÓA DỮ LIỆU CŨ"
    log_warn "HÀNH ĐỘNG NÀY SẼ XÓA TOÀN BỘ DỮ LIỆU TRONG DATABASE!"
    
    if [ $DRY_RUN -eq 0 ]; then
        read -p "Bạn có chắc chắn muốn tiếp tục? (Gõ 'yes' để xác nhận): " confirm
        if [ "$confirm" != "yes" ]; then log_error "Đã hủy bỏ bởi người dùng."; exit 1; fi
        
        cd "$BACKEND_DIR"
        set +e
        FLUSH_OUTPUT=$(DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME "$PYTHON_CMD" manage.py flush --no-input 2>&1)
        EXIT_CODE=$?
        set -e
        
        if [ $EXIT_CODE -eq 0 ]; then
            log_success "Database đã được làm sạch."
        else
            log_warn "Lệnh flush không thành công hoàn toàn. Thử phương pháp Truncate..."
            truncate_all_public_tables
        fi
    else
        log_info "(DRY-RUN) Sẽ thực hiện xóa sạch database sau khi xác nhận."
    fi
}

import_data() {
    log_section "📥 ĐANG IMPORT DỮ LIỆU MỚI"
    cd "$BACKEND_DIR"
    
    if [ $DRY_RUN -eq 0 ]; then
        IMPORT_LOG="$DATA_DIR/LOAD_IMPORT_$(date +%Y%m%d_%H%M%S).log"
        set +e
        DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME "$PYTHON_CMD" scripts/load_seed_data.py "$DATA_FIXED_DIR" 2>&1 | tee "$IMPORT_LOG"
        EXIT_CODE=$?
        set -e
        
        if grep -q "\[ERROR\]" "$IMPORT_LOG" || [ $EXIT_CODE -ne 0 ]; then
            log_error "Quá trình Import thất bại. Xem chi tiết tại: $IMPORT_LOG"
            exit 1
        fi
        log_success "Import dữ liệu hoàn tất thành công."
        log_info "Log chi tiết được lưu tại: $IMPORT_LOG"
    else
        log_info "(DRY-RUN) Sẽ chạy script load_seed_data.py"
    fi
}

sync_sequences() {
    log_section "🔄 ĐỒNG BỘ HÓA SEQUENCE (POSTGRESQL)"
    if [ $DRY_RUN -eq 1 ]; then return 0; fi
    
    cd "$BACKEND_DIR"
    DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME "$PYTHON_CMD" << 'EOF'
import os, sys, django
from django.core.management.color import no_style
from django.db import connection
from django.apps import apps
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
with connection.cursor() as cursor:
    for app_config in apps.get_app_configs():
        if app_config.models_module:
            statements = connection.ops.sequence_reset_sql(no_style(), app_config.get_models())
            for s in statements: cursor.execute(s)
print("Sequence synchronized.")
EOF
    log_success "Đã đồng bộ hóa tất cả sequences."
}

verify_data() {
    log_section "✅ KIỂM TRA DỮ LIỆU SAU IMPORT"
    if [ $DRY_RUN -eq 1 ]; then return 0; fi
    
    cd "$BACKEND_DIR"
    DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_NAME=$DB_NAME "$PYTHON_CMD" << 'EOF'
import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.billing.models import Transaction

print("\n📊 Kết quả thống kê:")
models = [("Người dùng", CustomUser), ("Công ty", Company), ("Việc làm", Job), ("Đơn ứng tuyển", Application), ("Giao dịch", Transaction)]
for name, model in models:
    count = model.objects.count()
    status = "✓" if count > 0 else "⚠"
    print(f"  {status} {name}: {count}")
print("")
EOF
}

# ============================================================================
# 6. HÀM CHÍNH (MAIN)
# ============================================================================

main() {
    log_section "🚀 KHỞI ĐỘNG HỆ THỐNG RESET & IMPORT DỮ LIỆU JOBIO"
    
    parse_args "$@"
    check_prerequisites
    validate_unique_seed_data
    backup_database
    flush_database
    import_data
    sync_sequences
    verify_data
    
    log_section "✨ TẤT CẢ ĐÃ HOÀN TẤT!"
    
    if [ $DRY_RUN -eq 1 ]; then
        log_warn "Đây là chế độ DRY-RUN. Không có thay đổi nào thực sự diễn ra."
    else
        log_success "Dữ liệu đã được cập nhật thành công!"
        log_info "Tiếp theo bạn có thể:"
        echo "  1. Kiểm tra Admin: http://localhost:8000/admin"
        echo "  2. Chạy Server: python manage.py runserver"
    fi
}

main "$@"
