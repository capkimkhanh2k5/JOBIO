# Refactor Checklist - Remove Campaign & Referral End-to-End

## A. Database
- [x] A1. Create archival migration script for campaign/referral tables
- [x] A2. Backup current data from target tables before destructive changes
- [x] A3. Drop legacy and active campaign/referral tables from runtime schema
- [x] A4. Add rollback notes for restoring dropped tables from backup

## B. Backend - App Wiring
- [x] B1. Remove campaign/referral apps from installed apps and URL routing
- [x] B2. Remove backend API modules for recruitment campaigns
- [x] B3. Remove backend API modules for recruitment referrals
- [x] B4. Remove backend API modules for social referral programs/referrals

## C. Backend - Cleanup Dependencies
- [x] C1. Remove remaining imports/usages/tests/postman links referencing campaign/referral APIs
- [x] C2. Ensure backend codebase has no runtime references to removed campaign/referral modules

## D. Frontend - Routing and Services
- [x] D1. Remove campaign/referral routes from frontend router
- [x] D2. Remove campaign/referral API service calls
- [x] D3. Remove campaign/referral UI pages/components
- [x] D4. Remove campaign/referral types and stale query usages

## E. Verification
- [x] E1. Run workspace-wide search to confirm no active campaign/referral runtime references
- [x] E2. Run backend sanity checks (import/startup oriented)
- [x] E3. Run frontend type/build sanity checks

## Execution Notes
- Backend migration added: `backend/apps/system/system_settings/migrations/0002_remove_campaign_referral_tables.py`
- SQLite backup file created: `backend/db_backups/campaign_referral_backup_2026-04-15.sql`
- Runtime DB tables dropped from `backend/db.sqlite3`:
	- `recruitment_campaigns`
	- `recruitment_campaigns_jobs`
	- `campaign_jobs`
	- `recruitment_referrals_referralprogram`
	- `recruitment_referrals_referral`
	- `recruitment_referrals_referralprogram_jobs`
	- `referral_programs`
	- `referrals`

## Rollback Notes
- To restore dropped SQLite tables, run:
	- `cd backend && sqlite3 db.sqlite3 < db_backups/campaign_referral_backup_2026-04-15.sql`
- Re-enable removed apps/routes/modules only if rollback is approved.

