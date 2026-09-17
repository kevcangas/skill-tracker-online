#!/bin/sh
set -e

echo "Starting Skill Tracker automated database backup task..."

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/skilltracker_dump_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Execute pg_dump
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

echo "Backup created successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Retention policy: remove backups older than BACKUP_RETENTION_DAYS
RETENTION=${BACKUP_RETENTION_DAYS:-7}
echo "Cleaning up backups older than ${RETENTION} days..."
find "${BACKUP_DIR}" -type f -name "skilltracker_dump_*.sql.gz" -mtime +${RETENTION} -delete

echo "Backup task finished cleanly."
