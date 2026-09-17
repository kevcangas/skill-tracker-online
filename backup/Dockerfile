FROM postgres:16-alpine

# Install cron and bash
RUN apk add --no-cache bash gzip findutils

WORKDIR /app

COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

# Run once at startup, then loop every 24 hours
CMD ["sh", "-c", "/app/backup.sh && while true; do sleep 86400; /app/backup.sh; done"]
