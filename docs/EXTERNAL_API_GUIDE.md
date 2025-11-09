# External API Access Guide

## Overview

This platform provides external REST API access via **PostgREST** for integration with external systems, mobile apps, and third-party services.

## API Endpoints

### Base URL
- **Development:** `http://localhost:3001`
- **Production:** `https://your-domain.com/api` (configured via reverse proxy)

### OpenAPI Documentation
Access auto-generated API documentation at:
```
GET http://localhost:3001/
```

## Authentication

### Option 1: API Key (Recommended for External Clients)

1. **Request API Key:**
   - Contact admin to create an API key
   - API keys are stored securely in Vault or encrypted database

2. **Use API Key:**
   ```bash
   curl -H "apikey: YOUR_API_KEY" \
        -H "Authorization: Bearer YOUR_API_KEY" \
        http://localhost:3001/spaces
   ```

### Option 2: JWT Token (For Advanced Use)

1. **Get JWT Token:**
   - Authenticate via `/api/auth/signin`
   - Receive JWT token in response

2. **Use JWT:**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:3001/data_models
   ```

## Available Endpoints

PostgREST automatically generates REST endpoints for all tables in the `public` schema.

### Common Endpoints

#### Spaces
```bash
# List all spaces
GET /spaces

# Get specific space
GET /spaces?id=eq.{uuid}

# Filter spaces
GET /spaces?is_active=eq.true&select=id,name,slug
```

#### Data Models
```bash
# List data models
GET /data_models?select=id,name,description

# Get model with attributes
GET /data_models?id=eq.{uuid}&select=*,data_model_attributes(*)
```

#### Data Records
```bash
# List records
GET /data_records?data_model_id=eq.{uuid}&limit=100

# Get record with values
GET /data_records?id=eq.{uuid}&select=*,data_record_values(*)
```

## Query Syntax

PostgREST uses a powerful query syntax:

### Filtering
```
?column=eq.value          # Equals
?column=neq.value         # Not equals
?column=gt.value          # Greater than
?column=gte.value         # Greater than or equal
?column=lt.value          # Less than
?column=lte.value         # Less than or equal
?column=like.*value*      # Pattern match
?column=ilike.*value*     # Case-insensitive pattern
?column=in.(val1,val2)    # In array
?column=is.null           # Is null
?column=not.is.null       # Is not null
```

### Selecting Columns
```
?select=id,name           # Specific columns
?select=*                 # All columns
?select=*,relation(*)     # Include relations
```

### Ordering
```
?order=name.asc           # Ascending
?order=created_at.desc    # Descending
?order=name.asc,id.desc   # Multiple columns
```

### Pagination
```
?limit=10                # Limit results
?offset=20               # Skip results
```

### Combining
```
GET /data_models?status=eq.active&select=id,name&order=name.asc&limit=50&offset=0
```

## Examples

### Example 1: Get Active Spaces
```bash
curl -H "apikey: YOUR_API_KEY" \
     "http://localhost:3001/spaces?is_active=eq.true&select=id,name,slug"
```

### Example 2: Get Customer Data
```bash
# First, get the customer model ID
curl -H "apikey: YOUR_API_KEY" \
     "http://localhost:3001/data_models?name=eq.customer&select=id"

# Then get customer records
curl -H "apikey: YOUR_API_KEY" \
     "http://localhost:3001/data_records?data_model_id=eq.{model_id}&select=*,data_record_values(*)"
```

### Example 3: Create Record
```bash
curl -X POST \
     -H "apikey: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"data_model_id": "{uuid}", "created_by": "{user_id}"}' \
     "http://localhost:3001/data_records"
```

## Security Best Practices

1. **Use HTTPS in Production:**
   - Always use HTTPS for external API access
   - Configure reverse proxy (nginx) with SSL

2. **Rotate API Keys:**
   - Regularly rotate API keys
   - Revoke compromised keys immediately

3. **Limit Access:**
   - Use Row Level Security (RLS) policies
   - Restrict API keys to specific spaces/resources

4. **Rate Limiting:**
   - Implement rate limiting per API key
   - Monitor API usage

5. **Audit Logging:**
   - All API access is logged
   - Review logs regularly

## Error Handling

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid query)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `406` - Not Acceptable (invalid Accept header)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "message": "Error description",
  "details": "Additional details",
  "hint": "Helpful hint",
  "code": "PGRST116"
}
```

## Rate Limits

Default limits:
- **Max rows per request:** 1000
- **Rate limit:** Configure via reverse proxy or API gateway

## Support

For API access requests or issues:
1. Contact your system administrator
2. Check API documentation at `/api-docs`
3. Review logs for error details

