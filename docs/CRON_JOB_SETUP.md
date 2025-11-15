# Cron Job Setup Guide

## Overview

The system includes a cron job endpoint for automatically processing pending import/export jobs. This ensures jobs are processed even when the application is idle.

## Endpoint

**URL**: `/api/import-export/jobs/cron`  
**Method**: `POST` or `GET`  
**Authentication**: Optional API key via `X-API-Key` header

## Configuration

### Environment Variables

```env
# Optional: API key for securing the cron endpoint
CRON_API_KEY=your-secret-api-key
# OR
JOB_QUEUE_API_KEY=your-secret-api-key
```

### Recommended Schedule

- **Frequency**: Every 1-5 minutes
- **Example**: `*/5 * * * *` (every 5 minutes)

## Setup Options

### 1. External Cron Service (Recommended)

#### EasyCron
1. Sign up at https://www.easycron.com
2. Create a new cron job:
   - **URL**: `https://your-domain.com/api/import-export/jobs/cron`
   - **Method**: POST
   - **Headers**: `X-API-Key: your-secret-api-key`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)

#### cron-job.org
1. Sign up at https://cron-job.org
2. Create a new job:
   - **URL**: `https://your-domain.com/api/import-export/jobs/cron`
   - **Method**: POST
   - **Headers**: `X-API-Key: your-secret-api-key`
   - **Schedule**: Every 5 minutes

### 2. Vercel Cron Jobs

If deploying on Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/import-export/jobs/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 3. Server Cron Job

If running on your own server, add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * curl -X POST -H "X-API-Key: your-secret-api-key" https://your-domain.com/api/import-export/jobs/cron
```

### 4. GitHub Actions (For Development)

Create `.github/workflows/process-jobs.yml`:

```yaml
name: Process Import/Export Jobs

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Job Processing
        run: |
          curl -X POST \
            -H "X-API-Key: ${{ secrets.CRON_API_KEY }}" \
            https://your-domain.com/api/import-export/jobs/cron
```

## Testing

### Manual Test

```bash
# Without API key (if not configured)
curl -X POST https://your-domain.com/api/import-export/jobs/cron

# With API key
curl -X POST \
  -H "X-API-Key: your-secret-api-key" \
  https://your-domain.com/api/import-export/jobs/cron
```

### Expected Response

```json
{
  "success": true,
  "message": "Job processing triggered",
  "processed": 3,
  "timestamp": "2025-01-XXT12:00:00.000Z"
}
```

## Monitoring

### Check Job Status

```bash
# Get job status
curl https://your-domain.com/api/import-export/jobs/{jobId}/status
```

### View Logs

Monitor your application logs for:
- `Job processing triggered` - Cron job executed
- `Processing job: {jobId}` - Job started
- `Job completed: {jobId}` - Job finished
- `Job failed: {jobId}` - Job failed

## Troubleshooting

### Jobs Not Processing

1. **Check cron job is running**:
   - Verify the cron service is active
   - Check cron logs for errors

2. **Check API key**:
   - Ensure `X-API-Key` header matches environment variable
   - If no API key configured, endpoint should work without it

3. **Check job queue**:
   - Verify jobs are in `PENDING` status
   - Check database for job records

4. **Check application logs**:
   - Look for error messages
   - Verify workers are registered

### Rate Limiting

The cron endpoint processes up to 50 jobs per run. If you have more jobs, they will be processed in subsequent runs.

## Security

1. **Always use API key in production**
2. **Use HTTPS** for cron requests
3. **Restrict access** to cron endpoint (IP whitelist if possible)
4. **Monitor for abuse** (unusual request patterns)

---

**Last Updated**: 2025-01-XX

