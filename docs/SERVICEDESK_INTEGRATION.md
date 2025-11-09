# ManageEngine ServiceDesk Plus Integration

## Overview

This document describes the comprehensive ManageEngine ServiceDesk Plus integration, including all features, API endpoints, configuration, and usage.

## Features

### Core Features
- ✅ **Ticket Push**: Push tickets from internal system to ServiceDesk
- ✅ **Ticket Update**: Update existing ServiceDesk tickets
- ✅ **Ticket Sync**: Two-way synchronization between systems
- ✅ **Comments**: Add and retrieve comments/notes
- ✅ **Attachments**: Upload and retrieve file attachments
- ✅ **Time Logging**: Log and retrieve time entries
- ✅ **Resolutions**: Set ticket resolutions
- ✅ **Ticket Linking**: Link related tickets
- ✅ **Ticket Search**: Search and list ServiceDesk tickets
- ✅ **Ticket Deletion**: Delete tickets from ServiceDesk

### Advanced Features
- ✅ **Rate Limiting**: Configurable API rate limiting per space
- ✅ **Retry Mechanism**: Automatic retry with exponential backoff
- ✅ **Audit Logging**: Comprehensive audit trail for all operations
- ✅ **Health Monitoring**: Health check endpoint for integration status
- ✅ **Background Jobs**: Queue system for bulk operations
- ✅ **Data Validation**: Input validation and sanitization
- ✅ **Caching**: Redis/in-memory caching for improved performance
- ✅ **Webhooks**: Real-time updates from ServiceDesk
- ✅ **Scheduled Sync**: Automated synchronization schedules
- ✅ **Field Mappings**: Custom field mapping configuration
- ✅ **Ticket Templates**: Pre-configured ticket templates
- ✅ **Conflict Resolution**: Detect and resolve data conflicts
- ✅ **Export/Import**: Configuration export and import

## API Endpoints

### Configuration
- `GET /api/integrations/manageengine-servicedesk` - Get configuration
- `POST /api/integrations/manageengine-servicedesk` - Create/update configuration
- `PUT /api/integrations/manageengine-servicedesk` - Update configuration
- `POST /api/integrations/manageengine-servicedesk/test` - Test connection

### Ticket Operations
- `POST /api/integrations/manageengine-servicedesk/push` - Push ticket to ServiceDesk
- `POST /api/integrations/manageengine-servicedesk/update` - Update ServiceDesk ticket
- `POST /api/integrations/manageengine-servicedesk/sync` - Sync from ServiceDesk
- `POST /api/integrations/manageengine-servicedesk/delete` - Delete ServiceDesk ticket
- `GET /api/integrations/manageengine-servicedesk/list` - List/search tickets

### Bulk Operations
- `POST /api/integrations/manageengine-servicedesk/bulk-push` - Push multiple tickets
- `POST /api/integrations/manageengine-servicedesk/jobs` - Create/list jobs
- `POST /api/integrations/manageengine-servicedesk/jobs/process` - Process jobs

### Comments & Attachments
- `POST /api/integrations/manageengine-servicedesk/comments` - Add comment
- `GET /api/integrations/manageengine-servicedesk/comments` - Get comments
- `POST /api/integrations/manageengine-servicedesk/attachments` - Upload attachment
- `GET /api/integrations/manageengine-servicedesk/attachments` - Get attachments

### Time & Resolution
- `POST /api/integrations/manageengine-servicedesk/time-logs` - Log time
- `GET /api/integrations/manageengine-servicedesk/time-logs` - Get time logs
- `POST /api/integrations/manageengine-servicedesk/resolution` - Set resolution

### Advanced Features
- `POST /api/integrations/manageengine-servicedesk/link` - Link tickets
- `GET /api/integrations/manageengine-servicedesk/health` - Health check
- `POST /api/integrations/manageengine-servicedesk/webhook` - Webhook receiver
- `GET /api/integrations/manageengine-servicedesk/sync-schedule` - Get sync schedules
- `POST /api/integrations/manageengine-servicedesk/sync-schedule` - Create sync schedule
- `PUT /api/integrations/manageengine-servicedesk/sync-schedule` - Trigger sync
- `GET /api/integrations/manageengine-servicedesk/field-mappings` - Get field mappings
- `POST /api/integrations/manageengine-servicedesk/field-mappings` - Create field mapping
- `DELETE /api/integrations/manageengine-servicedesk/field-mappings` - Delete mapping
- `GET /api/integrations/manageengine-servicedesk/templates` - Get templates
- `POST /api/integrations/manageengine-servicedesk/templates` - Create template
- `DELETE /api/integrations/manageengine-servicedesk/templates` - Delete template
- `GET /api/integrations/manageengine-servicedesk/sync-logs` - Get sync logs
- `GET /api/integrations/manageengine-servicedesk/export-config` - Export configuration
- `POST /api/integrations/manageengine-servicedesk/import-config` - Import configuration
- `POST /api/integrations/manageengine-servicedesk/conflict-resolution` - Resolve conflicts

## Configuration

### Basic Setup

1. Navigate to Space Settings → Data Sync → ServiceDesk Integration
2. Enter your ServiceDesk Plus URL (e.g., `https://yourcompany.servicedeskplus.com`)
3. Enter your API Key or Technician Key
4. Click "Test Connection" to verify
5. Click "Save Configuration"

### Rate Limiting

Rate limits are configured per space:
- **Max Requests Per Minute**: Default 60
- **Max Requests Per Hour**: Default 1000
- **Max Requests Per Day**: Default 10000
- **Block Duration**: Default 300 seconds (5 minutes)

### Sync Schedules

Configure automated synchronization:
- **Manual**: No automatic sync
- **Interval**: Sync every N minutes
- **Hourly**: Sync at specific minutes past the hour
- **Daily**: Sync at specific time each day

### Field Mappings

Create custom mappings between internal fields and ServiceDesk fields:
```json
{
  "local_field": "servicedesk_field",
  "priority": "priority.name",
  "status": "status.name"
}
```

### Ticket Templates

Create reusable ticket templates:
```json
{
  "category": "Request",
  "subcategory": "Access Request",
  "group": "IT Support",
  "defaultFields": {
    "priority": "Medium"
  }
}
```

## Usage Examples

### Push a Ticket

```typescript
const response = await fetch('/api/integrations/manageengine-servicedesk/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticket_id: 'ticket-uuid',
    space_id: 'space-uuid',
    syncComments: true,
    syncAttachments: true,
    syncTimeLogs: true
  })
})
```

### Bulk Push with Job Queue

```typescript
const response = await fetch('/api/integrations/manageengine-servicedesk/bulk-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticket_ids: ['ticket-1', 'ticket-2', 'ticket-3'],
    space_id: 'space-uuid',
    useJobQueue: true // Automatically uses job queue for >5 tickets
  })
})

// Get job status
const jobResponse = await fetch(`/api/integrations/manageengine-servicedesk/jobs?job_id=${response.jobId}`)
```

### Health Check

```typescript
const health = await fetch('/api/integrations/manageengine-servicedesk/health?space_id=space-uuid')
const status = await health.json()
// Returns: { healthy: true, status: 'healthy', responseTime: 123 }
```

## Rate Limiting

All endpoints respect rate limits configured per space. When rate limited:
- HTTP 429 status code
- `X-RateLimit-Limit` header
- `X-RateLimit-Remaining` header
- `X-RateLimit-Reset` header
- `Retry-After` header

## Retry Mechanism

Automatic retry with exponential backoff:
- **Max Retries**: 3
- **Initial Delay**: 1 second
- **Max Delay**: 30 seconds
- **Backoff Multiplier**: 2x
- **Retryable Status Codes**: 429, 500, 502, 503, 504

## Caching

Response caching for improved performance:
- **Ticket Details**: 5 minutes
- **Comments**: 3 minutes
- **Attachments**: 5 minutes
- **Time Logs**: 3 minutes

Cache is automatically invalidated on updates.

## Webhooks

Configure webhook URL in ServiceDesk Plus:
```
POST https://your-app.com/api/integrations/manageengine-servicedesk/webhook
```

Supported events:
- `request.created`
- `request.updated`
- `request.status_changed`
- `request.comment_added`
- `request.attachment_added`

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "validationErrors": ["Error 1", "Error 2"],
  "warnings": ["Warning 1"]
}
```

## Security

- API keys stored securely using HashiCorp Vault or encrypted database storage
- Rate limiting prevents abuse
- Audit logging tracks all operations
- Webhook signature verification

## Troubleshooting

### Connection Issues
1. Verify ServiceDesk URL is correct
2. Check API key is valid
3. Ensure network connectivity
4. Check health endpoint: `/api/integrations/manageengine-servicedesk/health`

### Rate Limiting
1. Check rate limit configuration
2. Review sync logs for patterns
3. Adjust limits in space settings

### Sync Issues
1. Check sync logs: `/api/integrations/manageengine-servicedesk/sync-logs`
2. Verify field mappings
3. Check for conflicts: `/api/integrations/manageengine-servicedesk/conflict-resolution`

## Support

For issues or questions:
1. Check sync logs and audit logs
2. Review health check endpoint
3. Check ServiceDesk Plus API documentation
4. Contact support with relevant log IDs

