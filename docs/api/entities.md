# Entities API Documentation

## Overview

Entities are individual instances of entity types in the EAV system. Each entity represents a specific record (e.g., a specific customer, product, or order) with its associated attribute values.

## Endpoints

### GET /api/eav/entities

Retrieve all entities with optional filtering.

**Query Parameters:**
- `entityTypeId` (string, optional): Filter by entity type ID
- `entityType` (string, optional): Filter by entity type name
- `isActive` (boolean, optional): Filter by active status
- `search` (string, optional): Search in entity values
- `sort` (string, optional): Sort field (created_at, updated_at, external_id)
- `order` (string, optional): Sort order (asc, desc)
- `limit` (number, optional): Number of results to return
- `offset` (number, optional): Number of results to skip
- `includeValues` (boolean, optional): Include attribute values in response

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "entityTypeId": "uuid",
      "entityType": {
        "id": "uuid",
        "name": "customer",
        "displayName": "Customer"
      },
      "externalId": "CUST-001",
      "isActive": true,
      "metadata": {
        "source": "import",
        "tags": ["vip", "premium"]
      },
      "values": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1-555-0123",
        "is_vip": true
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/eav/entities

Create a new entity with values.

**Request Body:**
```json
{
  "entityTypeId": "uuid",
  "externalId": "CUST-002",
  "isActive": true,
  "metadata": {
    "source": "manual",
    "tags": ["new"]
  },
  "values": {
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0124",
    "is_vip": false
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "entityTypeId": "uuid",
  "entityType": {
    "id": "uuid",
    "name": "customer",
    "displayName": "Customer"
  },
  "externalId": "CUST-002",
  "isActive": true,
  "metadata": {
    "source": "manual",
    "tags": ["new"]
  },
  "values": {
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0124",
    "is_vip": false
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### GET /api/eav/entities/[id]

Retrieve a specific entity by ID.

**Response:**
```json
{
  "id": "uuid",
  "entityTypeId": "uuid",
  "entityType": {
    "id": "uuid",
    "name": "customer",
    "displayName": "Customer"
  },
  "externalId": "CUST-001",
  "isActive": true,
  "metadata": {
    "source": "import",
    "tags": ["vip", "premium"]
  },
  "values": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "is_vip": true
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### PUT /api/eav/entities/[id]

Update an existing entity.

**Request Body:**
```json
{
  "isActive": true,
  "metadata": {
    "source": "import",
    "tags": ["vip", "premium", "updated"]
  },
  "values": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "is_vip": true,
    "credit_limit": 15000.00
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "entityTypeId": "uuid",
  "entityType": {
    "id": "uuid",
    "name": "customer",
    "displayName": "Customer"
  },
  "externalId": "CUST-001",
  "isActive": true,
  "metadata": {
    "source": "import",
    "tags": ["vip", "premium", "updated"]
  },
  "values": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "is_vip": true,
    "credit_limit": 15000.00
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### DELETE /api/eav/entities/[id]

Delete an entity (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Entity deleted successfully"
}
```

## Entity Values

### GET /api/eav/entities/[id]/values

Retrieve all values for a specific entity.

**Response:**
```json
{
  "entityId": "uuid",
  "entityType": {
    "id": "uuid",
    "name": "customer",
    "displayName": "Customer"
  },
  "values": [
    {
      "id": "uuid",
      "attributeId": "uuid",
      "attribute": {
        "id": "uuid",
        "name": "first_name",
        "displayName": "First Name",
        "dataType": "TEXT"
      },
      "textValue": "John",
      "numberValue": null,
      "booleanValue": null,
      "dateValue": null,
      "datetimeValue": null,
      "jsonValue": null,
      "blobValue": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "attributeId": "uuid",
      "attribute": {
        "id": "uuid",
        "name": "is_vip",
        "displayName": "VIP Customer",
        "dataType": "BOOLEAN"
      },
      "textValue": null,
      "numberValue": null,
      "booleanValue": true,
      "dateValue": null,
      "datetimeValue": null,
      "jsonValue": null,
      "blobValue": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/eav/entities/[id]/values

Set values for an entity (replaces all existing values).

**Request Body:**
```json
{
  "values": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "is_vip": true,
    "credit_limit": 10000.00
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Values updated successfully",
  "updatedCount": 6
}
```

### PUT /api/eav/entities/[id]/values

Update specific values for an entity.

**Request Body:**
```json
{
  "values": {
    "phone": "+1-555-0124",
    "is_vip": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Values updated successfully",
  "updatedCount": 2
}
```

### DELETE /api/eav/entities/[id]/values

Delete all values for an entity.

**Response:**
```json
{
  "success": true,
  "message": "All values deleted successfully"
}
```

## Search and Filtering

### Text Search
Search across all text values:
```bash
curl -X GET "/api/eav/entities?search=john&entityType=customer"
```

### Attribute-Specific Search
Search within specific attributes:
```bash
curl -X GET "/api/eav/entities?entityType=customer&email=john.doe@example.com"
```

### Date Range Filtering
Filter by date ranges:
```bash
curl -X GET "/api/eav/entities?entityType=order&order_date_from=2024-01-01&order_date_to=2024-01-31"
```

### Boolean Filtering
Filter by boolean values:
```bash
curl -X GET "/api/eav/entities?entityType=customer&is_vip=true"
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Required attribute 'email' is missing",
  "details": {
    "field": "values.email",
    "code": "REQUIRED_ATTRIBUTE_MISSING"
  }
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Entity not found",
  "code": "ENTITY_NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Entity with external ID already exists",
  "code": "DUPLICATE_EXTERNAL_ID"
}
```

## Examples

### Create a Customer Entity
```bash
curl -X POST /api/eav/entities \
  -H "Content-Type: application/json" \
  -d '{
    "entityTypeId": "customer-entity-type-id",
    "externalId": "CUST-003",
    "values": {
      "first_name": "Bob",
      "last_name": "Johnson",
      "email": "bob.johnson@example.com",
      "phone": "+1-555-0125",
      "is_vip": true
    }
  }'
```

### Create a Product Entity
```bash
curl -X POST /api/eav/entities \
  -H "Content-Type: application/json" \
  -d '{
    "entityTypeId": "product-entity-type-id",
    "values": {
      "name": "Wireless Mouse",
      "price": 29.99,
      "category": "Accessories",
      "in_stock": true
    }
  }'
```

### Update Entity Values
```bash
curl -X PUT /api/eav/entities/entity-id/values \
  -H "Content-Type: application/json" \
  -d '{
    "values": {
      "phone": "+1-555-0126",
      "is_vip": false
    }
  }'
```

### Search Entities
```bash
curl -X GET "/api/eav/entities?entityType=customer&search=john&includeValues=true&sort=created_at&order=desc&limit=20"
```
