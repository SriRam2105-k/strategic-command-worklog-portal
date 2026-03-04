# Supabase Data Import Guide

To avoid foreign key constraint errors, please import the CSV files in the following exact order.

### Pre-requisites
1. Ensure you have run the `supabase_setup.sql` script to create all tables.
2. If you are re-importing, it is recommended to empty existing tables first (use `TRUNCATE table_name CASCADE;`).

### Import Order

1.  **Project**: `project.csv`
2.  **Team**: `team.csv` (Depends on Project)
3.  **User**: `user.csv` (Depends on Team)
4.  **Milestone**: `milestone.csv` (Depends on Project)
5.  **Attendance**: `attendance.csv` (Depends on User)
6.  **AuditLog**: `auditLog.csv` (Depends on User)

### Other Tables (If they have data)
7.  **Worklog**: `worklog.csv` (Depends on User and Project)
8.  **Message**: `message.csv` (Depends on User)
9.  **Notification**: `notification.csv` (Depends on User)
10. **PeerReview**: `peerReview.csv` (Depends on User)
11. **ArchiveItem**: `archiveItem.csv` (No dependencies)

### Pro-Tips for Supabase CSV Import
- Use the **Table Editor** in Supabase.
- Click **Insert** -> **Import from CSV**.
- Ensure the column names in the CSV match the table columns exactly.
- Supabase will auto-detect "empty" values as `NULL`.
