# 📖 LOAD DATA SCRIPT - HƯỚNG DẪN SỬ DỤNG

**Created:** 2026-04-25  
**Script:** `/Users/capkimkhanh/Documents/DUT/JOBIO/DataSet/loadData.sh`  
**Purpose:** Xóa dữ liệu cũ và import dữ liệu mới từ `Data_Final_FIXED/`

---

## 🚀 QUICK START

### 1️⃣ **Bước chuẩn bị (lần đầu tiên)**

```bash
# Đi tới thư mục DataSet
cd /Users/capkimkhanh/Documents/DUT/JOBIO/DataSet

# Script đã executable rồi, chỉ cần chạy:
./loadData.sh
```

### 2️⃣ **Cập nhật dữ liệu mới**

Nếu bạn xóa folder `Data_Final` cũ và thay bằng files mới:

```bash
# Xóa Data_Final cũ
rm -rf Data_Final

# Copy files mới vào (hoặc tạo mới)
# ... copy các JSON files vào Data_Final_FIXED/ ...

# Chạy script
./loadData.sh
```

---

## 📋 CÁCH SỬ DỤNG

### **Lệnh cơ bản (Load bình thường)**
```bash
./loadData.sh
```
→ Sẽ xóa data cũ và import data mới

### **Xem kế hoạch trước khi thực hiện (DRY-RUN)**
```bash
./loadData.sh --dry-run
```
→ Hiển thị những gì sẽ xảy ra mà KHÔNG thực hiện  
✅ **RECOMMENDED:** Chạy lần đầu để xem có lỗi không

### **Xem chi tiết mỗi bước (VERBOSE)**
```bash
./loadData.sh --verbose
```
→ Hiển thị tất cả output chi tiết

### **Kết hợp nhiều options**
```bash
./loadData.sh --dry-run --verbose
```
→ Xem chi tiết kế hoạch mà không thực hiện

### **Bỏ qua backup (KHÔNG khuyến cáo!)**
```bash
./loadData.sh --no-backup
```
→ Bỏ qua backup database (chỉ dùng khi đang test)

### **Xem hướng dẫn**
```bash
./loadData.sh --help
```
→ Hiển thị tất cả options

---

## 🎯 WORKFLOW RECOMMENDED

### **Lần đầu tiên:**

```bash
# 1️⃣ Xem kế hoạch (DRY-RUN)
./loadData.sh --dry-run --verbose

# Nếu không có lỗi, chạy thực tế:

# 2️⃣ Confirm backup location
# Script sẽ tự động backup vào: /Users/capkimkhanh/Documents/DUT/JOBIO/database_backups/

# 3️⃣ Chạy load data
./loadData.sh

# Nhập: yes (để confirm xóa data cũ)

# 4️⃣ Verify dữ liệu
# Script sẽ tự động check record counts
```

---

## ✅ SCRIPT SẼ THỰC HIỆN:

### 1️⃣ **Kiểm tra Prerequisites**
- ✓ Backend directory tồn tại
- ✓ Data directory tồn tại  
- ✓ manage.py tồn tại
- ✓ Python3 available
- ✓ Tất cả required JSON files tồn tại

### 2️⃣ **Backup Database**
```bash
# Tự động backup vào:
/Users/capkimkhanh/Documents/DUT/JOBIO/database_backups/
jobio_db_20260425_143045.sql
```

### 3️⃣ **Xóa Data Cũ (Flush)**
```bash
python manage.py flush --no-input
# Xóa tất cả dữ liệu nhưng giữ lại schema
```

### 4️⃣ **Import Data Mới - Theo Thứ Tự**
```
 users.json
 ↓
 addresses.json
 ↓
 industries.json, provinces.json
 ↓
 companies.json
 ↓
 recruiters.json, jobs.json
 ↓
 applications.json, interviews.json
 ↓
 transactions.json, company_subscriptions.json
 ↓
 ... (và các file khác)
```

### 5️⃣ **Verify Data**
```
✓ Users: 100 records
✓ Companies: 50 records
✓ Jobs: 150 records
✓ Applications: 500 records
✓ Transactions: 25 records
```

### 6️⃣ **Generate Report**
```bash
LOAD_REPORT_20260425_143045.txt
# Chi tiết toàn bộ quá trình import
```

---

## 📊 OUTPUT EXAMPLE

```
================================================================================
🚀 JOBIO DATABASE RESET & DATA IMPORT
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CHECKING PREREQUISITES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All prerequisites checked ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 BACKING UP DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database backed up to: /Users/.../jobio_db_20260425_143045.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗑️  FLUSHING OLD DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  This will DELETE all data from the database!
Are you sure? Type 'yes' to confirm: yes
✅ Database flushed successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 IMPORTING DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/29] Loading users.json... ✓
[2/29] Loading addresses.json... ✓
[3/29] Loading industries.json... ✓
[4/29] Loading companies.json... ✓
[5/29] Loading jobs.json... ✓
...
[29/29] Loading activity_log_types.json... ✓
✅ Data import completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERIFYING IMPORTED DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Data Verification Results:

  ✓ Users: 100 records
  ✓ Companies: 50 records
  ✓ Jobs: 150 records
  ✓ Applications: 500 records
  ✓ Recruiters: 80 records
  ✓ Transactions: 25 records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 IMPORT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Report saved to: /Users/.../LOAD_REPORT_20260425_143045.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ ALL DONE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Database has been reset and new data imported successfully!

Next steps:
  1. Verify data in admin panel: http://localhost:8000/admin
  2. Run tests: python manage.py test
  3. Start server: python manage.py runserver
```

---

## 🔄 CÁC TÌNH HUỐNG THƯỜNG GẶP

### **Tình huống 1: Lần đầu sử dụng**
```bash
# 1. Xem kế hoạch
./loadData.sh --dry-run --verbose

# 2. Kiểm tra output
# Nếu OK, chạy thực tế:
./loadData.sh
```

### **Tình huống 2: Cập nhật dữ liệu mới**
```bash
# 1. Xóa folder cũ
rm -rf Data_Final

# 2. Các file mới đã có sẵn trong Data_Final_FIXED/
# hoặc bạn update files vào Data_Final_FIXED/

# 3. Chạy script
./loadData.sh
```

### **Tình huống 3: Quên xóa folder Data_Final cũ**
```bash
# Không sao, script sẽ dùng Data_Final_FIXED/ (không liên quan tới Data_Final)
./loadData.sh

# Sau đó bạn có thể xóa Data_Final cũ:
rm -rf Data_Final
```

### **Tình huống 4: Muốn backup trước**
```bash
# Backup tự động được tạo, nhưng bạn cũng có thể manual:
cd /Users/capkimkhanh/Documents/DUT/JOBIO/backend
python manage.py dumpdata > ../database_backups/manual_backup_$(date +%s).json

# Rồi chạy script
cd ../DataSet
./loadData.sh
```

### **Tình huống 5: Muốn restore từ backup**
```bash
# Tìm backup cũ
ls /Users/capkimkhanh/Documents/DUT/JOBIO/database_backups/

# Restore (nếu backup là SQL)
psql -U postgres -h localhost jobio_db < database_backups/jobio_db_20260425_143045.sql
```

---

## ⚠️ CẢNH BÁO

| ⚠️ Cảnh báo | Giải thích |
|-----------|-----------|
| **Script sẽ XÓA tất cả data** | Đó là mục đích, nhưng có backup |
| **Cần xác nhận (yes/no)** | Để tránh xóa vô tình |
| **Cần PosgreSQL chạy** | Nếu không có, skip backup |
| **Cần Python3 & Django** | Phải có backend environment |
| **Không run parallel** | Chỉ chạy 1 instance tại 1 lần |

---

## 🐛 TROUBLESHOOTING

### **Lỗi: "Backend directory not found"**
```bash
# Check path đúng không
ls -la /Users/capkimkhanh/Documents/DUT/JOBIO/backend

# Nếu sai, sửa trong script:
# Dòng: BACKEND_DIR="..."
```

### **Lỗi: "PostgreSQL connection failed"**
```bash
# Check PG running
psql -U postgres -h localhost -d jobio_db -c "SELECT 1"

# Nếu lỗi, start PG:
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
```

### **Lỗi: "JSON files not valid"**
```bash
# Check files đã được fix chưa
ls -la Data_Final_FIXED/

# Nếu chưa, chạy fixer:
python3 data_fixer.py Data_Final
```

### **Import failed - FK constraint error**
```bash
# Check thứ tự file đúng không
# Script đã có thứ tự rồi, nên nếu lỗi là do data bị corrupt

# Solution: Xem log chi tiết
./loadData.sh --verbose

# Hoặc check file JSON:
cat Data_Final_FIXED/transactions.json | head -20
```

---

## 💡 TIPS

✅ **Luôn chạy `--dry-run` trước lần đầu**
```bash
./loadData.sh --dry-run --verbose
```

✅ **Giữ backup an toàn**
```bash
# Backups tự động lưu ở:
/Users/capkimkhanh/Documents/DUT/JOBIO/database_backups/

# Bạn có thể archive chúng:
tar -czf backups_archive.tar.gz database_backups/
```

✅ **Verify data sau import**
```bash
cd backend
python manage.py shell

>>> from apps.recruitment.jobs.models import Job
>>> Job.objects.count()  # Should see > 0

>>> from apps.billing.models import Transaction
>>> Transaction.objects.count()  # Should see > 0
```

✅ **Monitor import progress**
```bash
./loadData.sh --verbose | tee import.log
# Lưu output vào import.log để xem sau
```

---

## 📝 SCRIPT LOCATIONS

```
/Users/capkimkhanh/Documents/DUT/JOBIO/
├── DataSet/
│   ├── loadData.sh                    ← ⭐ RUN THIS
│   ├── Data_Final/                    ← OLD DATA (bạn xóa nó)
│   ├── Data_Final_FIXED/              ← NEW DATA (script dùng này)
│   ├── data_fixer.py                  ← Fixer script
│   ├── data_validator.py              ← Validator script
│   └── LOAD_REPORT_*.txt              ← Auto-generated reports
└── database_backups/                  ← Auto-generated backups
    └── jobio_db_*.sql

backend/
└── manage.py
```

---

## 🎉 SUMMARY

**Công dụng:** Xóa data cũ + Import data mới + Verify + Backup - **TẤT CẢ 1 LỆNH**

**Cách sử dụng:** 
```bash
cd /Users/capkimkhanh/Documents/DUT/JOBIO/DataSet
./loadData.sh
```

**Options:**
- `--dry-run` - Xem kế hoạch
- `--verbose` - Xem chi tiết
- `--no-backup` - Bỏ backup
- `--help` - Xem hướng dẫn

**Kết quả:** ✅ Database reset + data import + verify + report

---

