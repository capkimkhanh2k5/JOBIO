#!/usr/bin/env python3
"""
Data Validator - Kiểm tra tính hợp lệ của dữ liệu JSON sau khi sửa
Validate enum values, field names, data types, etc.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple, Any


class DataValidator:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.report = []
        self.validation_results = {
            'total_files': 0,
            'valid_files': 0,
            'invalid_files': 0,
            'errors': []
        }
        
        # Define valid enum values based on Django models
        self.valid_enums = {
            'transactions.json': {
                'type': ['subscription', 'add_on'],
                'status': ['pending', 'completed', 'failed', 'refunded']
            },
            'jobs.json': {
                'job_type': ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
                'salary_type': ['monthly', 'yearly', 'hourly', 'project'],
                'level': ['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'],
                'status': ['draft', 'published', 'closed', 'expired']
            },
            'company_subscriptions.json': {
                'status': ['active', 'pending', 'expired', 'cancelled']
            },
            'reports.json': {
                'status': ['pending', 'reviewing', 'resolved', 'rejected']
            },
            'interviews.json': {
                'status': ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
                'result': ['pass', 'fail', 'pending']
            },
            'job_alerts.json': {
                'job_type': ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
                'level': ['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'],
                'frequency': ['instant', 'daily', 'weekly']
            },
            'recruiters.json': {
                'job_search_status': ['active', 'passive', 'not_looking']
            }
        }
        
        # Required fields that should NOT be empty
        self.required_fields = {
            'transactions.json': {
                'vnp_BankCode', 'vnp_CardType', 'vnp_OrderInfo', 'vnp_TransactionNo'
            }
        }
    
    def log(self, message: str):
        """Log message"""
        print(message)
        self.report.append(message)
    
    def validate_file(self, filename: str) -> bool:
        """Validate một file JSON"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            self.log(f"❌ File not found: {filename}")
            self.validation_results['invalid_files'] += 1
            return False
        
        try:
            self.log(f"\n🔍 Validating: {filename}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                self.log(f"❌ {filename} is not a JSON array")
                self.validation_results['invalid_files'] += 1
                return False
            
            file_valid = True
            
            # Get valid enums for this file
            valid_enums = self.valid_enums.get(filename, {})
            required_fields = self.required_fields.get(filename, set())
            
            # Validate each record
            for idx, record in enumerate(data):
                record_errors = []
                
                # Check enum fields
                for field, valid_values in valid_enums.items():
                    if field in record:
                        value = record[field]
                        if value not in valid_values:
                            record_errors.append(
                                f"  Line {idx + 1}: {field} = '{value}' (must be one of {valid_values})"
                            )
                            file_valid = False
                
                # Check required fields exist (for transactions with VNPay)
                if filename == 'transactions.json' and record.get('type') == 'subscription':
                    for req_field in required_fields:
                        if req_field not in record:
                            record_errors.append(
                                f"  Line {idx + 1}: Missing required field '{req_field}'"
                            )
                            file_valid = False
                
                if record_errors:
                    for error in record_errors:
                        self.log(error)
                        self.validation_results['errors'].append(f"{filename}: {error}")
            
            if file_valid:
                self.log(f"✅ {filename} is VALID ({len(data)} records)")
                self.validation_results['valid_files'] += 1
            else:
                self.log(f"❌ {filename} has validation errors")
                self.validation_results['invalid_files'] += 1
            
            self.validation_results['total_files'] += 1
            return file_valid
            
        except json.JSONDecodeError as e:
            self.log(f"❌ JSON parsing error in {filename}: {e}")
            self.validation_results['invalid_files'] += 1
            self.validation_results['total_files'] += 1
            return False
        except Exception as e:
            self.log(f"❌ Error validating {filename}: {e}")
            self.validation_results['invalid_files'] += 1
            self.validation_results['total_files'] += 1
            return False
    
    def run(self):
        """Run validator on fixed data"""
        self.log("=" * 80)
        self.log("✅ DATA VALIDATOR - Verify Fixed JSON Data")
        self.log("=" * 80)
        
        # Files to validate
        files_to_validate = [
            'transactions.json',
            'jobs.json',
            'company_subscriptions.json',
            'reports.json',
            'interviews.json',
            'job_alerts.json',
            'recruiters.json'
        ]
        
        all_valid = True
        for filename in files_to_validate:
            if not self.validate_file(filename):
                all_valid = False
        
        # Summary
        self.log("\n" + "=" * 80)
        self.log("📊 VALIDATION SUMMARY")
        self.log("=" * 80)
        self.log(f"Total files: {self.validation_results['total_files']}")
        self.log(f"Valid files: {self.validation_results['valid_files']}")
        self.log(f"Invalid files: {self.validation_results['invalid_files']}")
        
        if self.validation_results['errors']:
            self.log(f"\n⚠️  Found {len(self.validation_results['errors'])} validation issues:")
            for error in self.validation_results['errors'][:20]:  # Show first 20
                self.log(f"  • {error}")
            if len(self.validation_results['errors']) > 20:
                self.log(f"  ... and {len(self.validation_results['errors']) - 20} more")
        else:
            self.log("\n✅ ALL FILES ARE VALID AND READY FOR IMPORT!")
        
        return all_valid


if __name__ == '__main__':
    import sys
    
    # Use fixed data directory
    data_dir = '/Users/capkimkhanh/Documents/DUT/JOBIO/DataSet/Data_Final/Data_Final_FIXED'
    
    if len(sys.argv) > 1:
        data_dir = sys.argv[1]
    
    validator = DataValidator(data_dir)
    is_valid = validator.run()
    
    sys.exit(0 if is_valid else 1)
